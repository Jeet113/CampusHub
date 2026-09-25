import { useEffect } from 'react'
import { X } from 'lucide-react'
export default function Modal({open,onClose,title,children,actions}) {
 useEffect(()=>{ if(!open)return; const esc=e=>e.key==='Escape'&&onClose(); document.addEventListener('keydown',esc); document.body.style.overflow='hidden'; return()=>{document.removeEventListener('keydown',esc);document.body.style.overflow=''} },[open,onClose])
 if(!open)return null
 return <div className="modal-backdrop" onMouseDown={e=>e.target===e.currentTarget&&onClose()}><section className="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title"><header><h2 id="modal-title">{title}</h2><button onClick={onClose} aria-label="Close dialog"><X size={20}/></button></header><div className="modal-body">{children}</div>{actions&&<footer>{actions}</footer>}</section></div>
}
