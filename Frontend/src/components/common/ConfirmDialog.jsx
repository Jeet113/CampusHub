import Modal from './Modal'
import Button from './Button'
export default function ConfirmDialog({open,onClose,onConfirm,title='Are you sure?',message,confirmLabel='Confirm',danger=false}) { return <Modal open={open} onClose={onClose} title={title} actions={<><Button variant="ghost" onClick={onClose}>Cancel</Button><Button variant={danger?'danger':'primary'} onClick={()=>{onConfirm();onClose()}}>{confirmLabel}</Button></>}><p className="muted-copy">{message}</p></Modal> }
