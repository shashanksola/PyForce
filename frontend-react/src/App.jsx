import { Editor } from '@monaco-editor/react'
import FileStruct from './conmponents/FileStruct'
import './App.css'

function App() {
  return (
    <div className='main-container'>
      <FileStruct />
      <Editor height='100vh' width='70vw' theme='vs-dark' language='python' />
    </div>
  )
}

export default App;