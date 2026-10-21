'use client';
import {useState} from 'react';
import {requireClient} from '@/lib/supabase';
import {normalizeLogin,pick,type Lang} from '@/lib/domain';
import {t} from '@/lib/copy';
import {Modal,Busy,ErrorNotice} from './ui';
export function AuthPanel({lang,mode:initial,onClose}:{lang:Lang;mode:'login'|'register'|'recovery';onClose:()=>void}){
 const [mode,setMode]=useState<'login'|'register'|'forgot'|'recovery'>(initial),[busy,setBusy]=useState(false),[error,setError]=useState(''),[notice,setNotice]=useState('');
 const title=mode==='register'?t(lang,'signup'):mode==='login'?t(lang,'signin'):pick(lang,'Parolni tiklash','Восстановление пароля','Reset password');
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setError('');setNotice('');const data=new FormData(e.currentTarget);
  try{const client=requireClient();const password=String(data.get('password')??'');
   if(mode==='recovery'){const {error}=await client.auth.updateUser({password});if(error)throw error;onClose();return;}
   const email=normalizeLogin(String(data.get('email')));
   if(mode==='forgot'){if(/@ekinix\.uz$/.test(email))throw new Error('invalid_login');const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:window.location.origin});if(error)throw error;setNotice(pick(lang,'Hisob mavjud bo‘lsa, emailga tiklash havolasi yuboriladi.','Если аккаунт существует, письмо для восстановления будет отправлено.','If an account exists, a reset link will be sent to that email.'));return;}
   if(mode==='register'){
    const {data:result,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:window.location.origin,data:{full_name:String(data.get('name')).trim(),region:String(data.get('region')??'Toshkent viloyati')}}});
    if(error)throw error;
    if(!result.session){setNotice(pick(lang,'Emailingizdagi tasdiqlash havolasini oching, keyin hisobga kiring.','Откройте ссылку подтверждения в письме, затем войдите.','Open the confirmation link in your email, then sign in.'));return;}
   }else{const {error}=await client.auth.signInWithPassword({email,password});if(error)throw error;}
   onClose();
  }catch(e){setError(e instanceof Error?e.message:'request_failed')}finally{setBusy(false)}
 }
 return <Modal lang={lang} title={title} onClose={onClose}><form onSubmit={submit} className="form-stack"><p className="muted">{pick(lang,'Dalalaringiz va kuzatuvlaringiz xavfsiz hisobingizda saqlanadi.','Ваши поля и наблюдения сохраняются в вашем аккаунте.','Your fields and observations stay in your secure account.')}</p><ErrorNotice error={error} lang={lang}/>{notice&&<p role="status" className="notice">{notice}</p>}
 {mode==='register'&&<label>{t(lang,'name')}<input name="name" autoComplete="name" required maxLength={100}/></label>}
 {mode!=='recovery'&&<label>{mode==='login'?pick(lang,'Email yoki eski hisob telefoni','Email или телефон старого аккаунта','Email or existing account phone'):t(lang,'email')}<input name="email" type={mode==='login'?'text':'email'} autoComplete="username" required maxLength={150}/></label>}
 {mode!=='forgot'&&<label>{t(lang,'password')}<input name="password" type="password" autoComplete={mode==='login'?'current-password':'new-password'} minLength={mode==='login'?6:10} maxLength={128} required/>{mode!=='login'&&<small className="muted">{pick(lang,'Kamida 10 ta belgi.','Не менее 10 символов.','At least 10 characters.')}</small>}</label>}
 {mode==='register'&&<p className="small muted">{pick(lang,'Yangi hisob uchun haqiqiy emaildan foydalaning. Eski telefon hisoblari bilan kirish saqlangan.','Используйте настоящий email для нового аккаунта. Вход в старые аккаунты по телефону сохранён.','Use a real email for new accounts. Existing phone-based accounts can still sign in.')}</p>}
 <button className="button primary full" disabled={busy}>{busy?<Busy label={t(lang,'loading')}/>:title}</button>
 {mode!=='recovery'&&<div className="auth-links"><button type="button" onClick={()=>{setMode(mode==='login'?'register':'login');setNotice('');setError('')}}>{mode==='login'?t(lang,'signup'):t(lang,'signin')}</button>{mode==='login'&&<button type="button" onClick={()=>setMode('forgot')}>{pick(lang,'Parol esdan chiqdimi?','Забыли пароль?','Forgot password?')}</button>}</div>}</form></Modal>;
}
