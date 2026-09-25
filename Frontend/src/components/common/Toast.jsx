import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { CheckCircle2, X } from 'lucide-react'
const ToastContext=createContext(null)
export function ToastProvider({children}) { const [items,setItems]=useState([]); const toast=useCallback((message)=>{const id=`${Date.now()}-${Math.random().toString(36).slice(2,8)}`;setItems(v=>[...v,{id,message}]);setTimeout(()=>setItems(v=>v.filter(x=>x.id!==id)),3200)},[]); const value=useMemo(()=>({toast}),[toast]); return <ToastContext.Provider value={value}>{children}<div className="toast-region" aria-live="polite">{items.map(i=><div className="toast" key={i.id}><CheckCircle2 size={18}/><span>{i.message}</span><button onClick={()=>setItems(v=>v.filter(x=>x.id!==i.id))} aria-label="Dismiss"><X size={16}/></button></div>)}</div></ToastContext.Provider> }
export const useToast=()=>useContext(ToastContext)
