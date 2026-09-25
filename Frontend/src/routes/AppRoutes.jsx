import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import DashboardLayout from '../components/layout/DashboardLayout'
import Landing from '../pages/public/Landing'
import { Login,Register,ForgotPassword } from '../pages/public/AuthPages'
import PublicBrowse from '../pages/public/PublicBrowse'
import { NotFound,Unauthorized } from '../pages/NotFound'
import { StudentDashboard,StudentEvents,StudentEventDetails,StudentClubs,StudentClubDetails,StudentNotices,StudentProfile,StudentNotifications,StudentSettings } from '../pages/student/StudentPages'
import { ClubDashboard,ClubProfile,ClubEvents,CreateEvent,ClubAnnouncements,ClubMembers,ClubSettings } from '../pages/club/ClubPages'
import { AdminDashboard,AdminUsers,AdminClubs,AdminEvents,AdminNotices,AdminApprovals,AdminSettings } from '../pages/admin/AdminPages'

function Guard({role,children}){const {user,ready}=useAuth();const loc=useLocation();if(!ready)return <div className="app-loading"><span/><p>Preparing CampusHub…</p></div>;if(!user)return <Navigate to="/login" replace state={{from:loc}}/>;if(user.role!==role)return <Navigate to="/unauthorized" replace/>;return children}

export default function AppRoutes(){return <Routes>
 <Route path="/" element={<Landing/>}/><Route path="/login" element={<Login/>}/><Route path="/register" element={<Register/>}/><Route path="/forgot-password" element={<ForgotPassword/>}/>
 <Route path="/events" element={<PublicBrowse type="events"/>}/><Route path="/events/:id" element={<PublicDetail type="event"/>}/><Route path="/clubs" element={<PublicBrowse type="clubs"/>}/><Route path="/clubs/:id" element={<PublicDetail type="club"/>}/><Route path="/notices" element={<PublicBrowse type="notices"/>}/>
 <Route path="/student" element={<Guard role="student"><DashboardLayout role="student"/></Guard>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<StudentDashboard/>}/><Route path="events" element={<StudentEvents/>}/><Route path="events/:id" element={<StudentEventDetails/>}/><Route path="clubs" element={<StudentClubs/>}/><Route path="clubs/:id" element={<StudentClubDetails/>}/><Route path="notices" element={<StudentNotices/>}/><Route path="profile" element={<StudentProfile/>}/><Route path="notifications" element={<StudentNotifications/>}/><Route path="settings" element={<StudentSettings/>}/></Route>
 <Route path="/club" element={<Guard role="club"><DashboardLayout role="club"/></Guard>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<ClubDashboard/>}/><Route path="profile" element={<ClubProfile/>}/><Route path="events" element={<ClubEvents/>}/><Route path="events/create" element={<CreateEvent/>}/><Route path="announcements" element={<ClubAnnouncements/>}/><Route path="members" element={<ClubMembers/>}/><Route path="settings" element={<ClubSettings/>}/></Route>
 <Route path="/admin" element={<Guard role="admin"><DashboardLayout role="admin"/></Guard>}><Route index element={<Navigate to="dashboard" replace/>}/><Route path="dashboard" element={<AdminDashboard/>}/><Route path="users" element={<AdminUsers/>}/><Route path="clubs" element={<AdminClubs/>}/><Route path="events" element={<AdminEvents/>}/><Route path="notices" element={<AdminNotices/>}/><Route path="approvals" element={<AdminApprovals/>}/><Route path="settings" element={<AdminSettings/>}/></Route>
 <Route path="/unauthorized" element={<Unauthorized/>}/><Route path="*" element={<NotFound/>}/>
 </Routes>}

import Navbar from '../components/layout/Navbar'
import Footer from '../components/layout/Footer'

function PublicDetail({type}){
  return (
    <div className="public-page">
      <Navbar/>
      <main className="browse-main">
        <div className="container" style={{paddingTop: 24, paddingBottom: 64}}>
          {type==='event'?<StudentEventDetails publicView/>:<StudentClubDetails publicView/>}
        </div>
      </main>
      <Footer/>
    </div>
  )
}
