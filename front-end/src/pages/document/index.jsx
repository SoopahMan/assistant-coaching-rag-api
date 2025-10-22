import { useState } from 'react'
import ListDocument from '../../components/document'
import FileUpload from '../../components/file-upload'
import { Button } from '@/components/ui/button'
import { Divider} from 'antd'
import BackButton from '@/components/ui/back'

// import { useNavigate } from 'react-router-dom'

const DocumentPage = () => {
    // const navigate = useNavigate()
    const [refreshList, setRefreshList] = useState(false)


return (
    <div>
        <BackButton></BackButton>
        <div className="md:col-span-4 bg-white p-4 rounded shadow overflow-auto">
            <FileUpload setRefreshList={setRefreshList} />
            <Divider />
            <ListDocument refreshList={refreshList} />
        </div>
    </div>
)
}
export default DocumentPage
