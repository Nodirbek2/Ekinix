'use client';
import {useEffect,useRef,type ReactNode} from 'react';
import {X,LoaderCircle} from 'lucide-react';
import {t,errorText} from '@/lib/copy';
import type {Lang} from '@/lib/domain';
export function Modal({title,onClose,children,wide=false,lang}:{title:string;onClose:()=>void;children:ReactNode;wide?:boolean;lang:Lang}){
 const ref=useRef<HTMLDialogElement>(null);
 useEffect(()=>{const el=ref.current;el?.showModal();const previous=document.body.style.overflow;document.body.style.overflow='hidden';return()=>{document.body.style.overflow=previous;el?.close();}},[]);
 return <dialog ref={ref} className={`modal ${wide?'modal-wide':''}`} onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose()}}><div className="modal-inner"><header><h2>{title}</h2><button type="button" className="icon-button" aria-label={t(lang,'close')} onClick={onClose}><X size={20}/></button></header>{children}</div></dialog>;
}
export function ErrorNotice({error,lang}:{error:string;lang:Lang}){return error?<div className="notice error" role="alert">{errorText(lang,error)}</div>:null}
export function Busy({label}:{label:string}){return <span className="busy"><LoaderCircle size={17} className="spin"/>{label}</span>}
export function Value({value,unit=''}:{value:number|null|undefined;unit?:string}){return <>{value===null||value===undefined?'—':new Intl.NumberFormat('en',{maximumFractionDigits:1}).format(value)}<small> {unit}</small></>}
