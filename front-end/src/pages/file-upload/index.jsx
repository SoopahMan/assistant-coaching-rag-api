import apiUrl from '@/config/api'
import { FAILURE, PENDING, SUCCESS } from '@/helpers/constants'
import {
  InboxOutlined,
  LoadingOutlined,
  UploadOutlined,
} from '@ant-design/icons'
import {
  Button,
  Col,
  Divider,
  message,
  Row,
  Spin,
  Table,
  Tag,
  Upload,
} from 'antd'
import { useEffect, useRef, useState } from 'react'

const { Dragger } = Upload

const FileUpload = ({ setRefreshList }) => {
  const [fileList, setFileList] = useState([])
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [taskList, setTaskList] = useState([])

  const handleUpload = async () => {
    if (fileList.length === 0) {
      message.warning('Please select files first')
      return
    }

    const formData = new FormData()
    fileList.forEach(({ originFileObj }) => {
      formData.append('files', originFileObj)
    })

    try {
      setUploading(true)

      const res = await apiUrl.post('/document/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (event) => {
          const percent = Math.round((event.loaded * 100) / event.total)
          setUploadProgress(percent)
        },
      })

      message.success('Upload berhasil')
      const uploadedTasks = res.data.payload
      setTaskList((prev) => [...prev, ...uploadedTasks])
    } catch (err) {
      console.error(err)
      message.error('Upload gagal')
    } finally {
      setUploading(false)
      setUploadProgress(0)
      setFileList([])
    }
  }

  const refreshedTaskIdsRef = useRef(new Set())

  useEffect(() => {
    const interval = setInterval(() => {
      let allTasksFinished = true

      taskList.forEach(async (task) => {
        const isFinished = task.status === SUCCESS || task.status === FAILURE

        if (!isFinished) {
          allTasksFinished = false

          try {
            const res = await apiUrl.get(`/task/${task.task_id}`)
            const updatedStatus = res.data.payload.status
            const updatedResult = res.data.payload.result

            setTaskList((prev) =>
              prev.map((t) =>
                t.task_id === task.task_id
                  ? { ...t, status: updatedStatus, result: updatedResult }
                  : t
              )
            )

            if (
              updatedStatus === SUCCESS &&
              !refreshedTaskIdsRef.current.has(task.task_id)
            ) {
              refreshedTaskIdsRef.current.add(task.task_id)
              setRefreshList((prev) => !prev)
            }
          } catch (error) {
            console.error('Failed to fetch task:', task.task_id, error)
          }
        }
      })

      if (allTasksFinished) {
        clearInterval(interval)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [taskList, setRefreshList])

  const columns = [
    { title: 'File', dataIndex: 'filename', key: 'filename' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (record) => {
        const color =
          record === SUCCESS ? 'green' : record === FAILURE ? 'red' : 'blue'
        return <Tag color={color}>{record}</Tag>
      },
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => {
        if (record.status === PENDING) {
          return <Spin indicator={<LoadingOutlined spin />} size="small" />
        }
        return record.result ? <pre>{record.result.slice(0, 10)}...</pre> : '-'
      },
    },
  ]

  return (
    <div>
      <h4 className="font-semibold mb-4">Upload Files</h4>
      <Row justify="center">
        <Col span={24}>
          <Spin spinning={uploading} tip={`Uploading... ${uploadProgress}%`}>
            <Dragger
              multiple
              accept=".pdf"
              beforeUpload={(file) => {
                const isPdf = file.type === 'application/pdf'
                if (!isPdf) {
                  message.error(`${file.name} is not a PDF`)
                }

                return false
              }}
              fileList={fileList}
              onChange={({ fileList: newFileList }) => {
                setFileList(
                  newFileList.filter((file) => file.type === 'application/pdf')
                )
              }}
              showUploadList={{ showRemoveIcon: true }}
            >
              <p className="ant-upload-drag-icon">
                <InboxOutlined />
              </p>
              <p className="ant-upload-text">
                Click or drag PDF files to upload
              </p>
              <p className="ant-upload-hint">
                Only PDF files are allowed. Multiple upload supported.
              </p>
            </Dragger>

            <Button
              icon={<UploadOutlined />}
              type="primary"
              onClick={handleUpload}
              disabled={fileList.length === 0 || uploading}
              loading={uploading}
              style={{ marginTop: 16 }}
            >
              Upload
            </Button>
          </Spin>
          <Divider />
          <h4 className="font-semibold">Processing Files</h4>
          <Table
            dataSource={taskList}
            columns={columns}
            rowKey="task_id"
            style={{ marginTop: 20 }}
            size="small"
          />
        </Col>
      </Row>
    </div>
  )
}

export default FileUpload
