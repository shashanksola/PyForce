import { Editor } from '@monaco-editor/react'
import FileStruct from './conmponents/FileStruct/FileStruct'
import './App.css'

function App() {
  return (
    <div className='main-container'>
      <FileStruct />
      <Editor height='70vh' width='100%' theme='vs-dark' language='python' />
    </div>
  )
}

export default App;