import apiUrl from '@/config/api'
import { DeleteOutlined } from '@ant-design/icons'
import { Button, Col, message, Modal, Row, Space, Table } from 'antd'
import { useEffect, useState } from 'react'

const ListDocument = ({ refreshList }) => {
  const [listData, setListData] = useState([])
  const [loading, setLoading] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await apiUrl.get('/document')
      const { payload } = res.data
      setListData(payload)
      setLoading(false)
    } catch (error) {
      setLoading(false)
      console.log('error', error)
    }
  }

  useEffect(() => {
    fetchData()
  }, [refreshList])

  const handleDelete = (record) => {
    Modal.confirm({
      title: `Delete document "${record.filename}"?`,
      content: 'This action cannot be undone.',
      okText: 'Yes, delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        try {
          const res = await apiUrl.delete(`/document/${record.id}`)
          if (res.data.status) {
            message.success(res.data.message)
            fetchData()
          }
        } catch (error) {
          message.error('Delete document failed')
          console.error(error)
        }
      },
    })
  }

  const columns = [
    {
      title: '#',
      dataIndex: 'page_number',
      key: 'page_number',
      render: (_, __, idx) => idx + 1,
    },
    { title: 'File', dataIndex: 'filename', key: 'filename' },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      render: (_, record) => (
        <Space>
          <Button
            color="danger"
            variant="solid"
            size="small"
            icon={<DeleteOutlined />}
            onClick={() => handleDelete(record)}
          />
        </Space>
      ),
    },
  ]

  return (
    <div>
      <h4 className="font-semibold">Uploaded Files</h4>
      <Row justify="center">
        <Col span={24}>
          <Table
            dataSource={listData}
            columns={columns}
            rowKey={(record) => record.filename}
            style={{ marginTop: 20 }}
            size="small"
            loading={loading}
          />
        </Col>
      </Row>
    </div>
  )
}

export default ListDocument
