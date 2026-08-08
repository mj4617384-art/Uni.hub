import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { ArrowLeft, Camera, MessageCircle } from 'lucide-react';

const FACULTY_DEPARTMENTS = {
  'Faculty of Engineering': ['Civil Engineering', 'Mechanical Engineering', 'Electrical/Electronic Engineering', 'Chemical Engineering', 'Computer Engineering', 'Petroleum Engineering', 'Agricultural Engineering'],
  'Faculty of Science': ['Physics', 'Chemistry', 'Biology/Biological Sciences', 'Computer Science', 'Mathematics', 'Microbiology', 'Biochemistry', 'Geology', 'Statistics'],
  'Faculty of Arts': ['English', 'History', 'Linguistics', 'Theatre Arts', 'Philosophy', 'Religious Studies', 'Foreign Languages'],
  'Faculty of Social Sciences': ['Economics', 'Political Science', 'Sociology', 'Psychology', 'Mass Communication', 'International Relations'],
  'Faculty of Law': ['Law'],
  'Faculty of Management Sciences': ['Accounting', 'Business Administration', 'Banking and Finance', 'Marketing', 'Actuarial Science', 'Insurance'],
  'Faculty of Education': ['Educational Management', 'Guidance and Counselling', 'Curriculum Studies', 'Adult Education', 'Physical and Health Education'],
  'Faculty of Agriculture': ['Agricultural Economics', 'Animal Science', 'Crop Science', 'Soil Science', 'Forestry and Wildlife'],
  'Faculty of Environmental Sciences': ['Architecture', 'Urban and Regional Planning', 'Estate Management', 'Building', 'Quantity Surveying', 'Surveying and Geoinformatics'],
  'College of Medicine': ['Medicine and Surgery', 'Nursing Science', 'Pharmacy', 'Physiology', 'Anatomy', 'Medical Laboratory Science', 'Public Health', 'Dentistry'],
  'Faculty of Computing / ICT': ['Computer Science', 'Information Technology', 'Software Engineering', 'Cybersecurity', 'Data Science'],
};

const LEVELS = ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level'];

export default function Profile() {
  const navigate = useNavigate();
  const { userId: routeUserId } = useParams();
  const [authUserId, setAuthUserId] = useState(null);
  const [isOwnProfile, setIsOwnProfile] = useState(true);
  const [displayName, setDisplayName] = useState('');
  const [editingName, setEditingName] = useState(false);
  const [savedName, setSavedName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [houseLocation, setHouseLocation] = useState('');
  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [savingDetails, setSavingDetails] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);

  const profileIncomplete = isOwnProfile && (!phoneNumber || !dateOfBirth || !houseLocation || !faculty || !department || !level);

  useEffect(() => {
    init();
  }, [routeUserId]);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  }

  async function init() {
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate('/login');
      return;
    }
    setAuthUserId(user.id);

    const viewingId = routeUserId || user.id;
    setIsOwnProfile(viewingId === user.id);

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name, avatar_url, phone_number, date_of_birth, house_location, faculty, department, level')
      .eq('id', viewingId)
      .single();

    if (profile) {
      setDisplayName(profile.display_name || '');
      setSavedName(profile.display_name || '');
      setAvatarUrl(profile.avatar_url || null);
      setPhoneNumber(profile.phone_number || '');
      setDateOfBirth(profile.date_of_birth || '');
      setHouseLocation(profile.house_location || '');
      setFaculty(profile.faculty || '');
      setDepartment(profile.department || '');
      setLevel(profile.level || '');
    }

    const { data: userPosts } = await supabase
      .from('posts')
      .select('*')
      .eq('user_id', viewingId)
      .order('created_at', { ascending: false });

    setPosts(userPosts || []);
    setLoading(false);
  }

  async function saveName() {
    if (!displayName.trim()) return;
    await supabase.from('profiles').update({ display_name: displayName }).eq('id', authUserId);
    setSavedName(displayName);
    setEditingName(false);
  }

  async function saveDetails() {
    setSavingDetails(true);
    await supabase
      .from('profiles')
      .update({
        phone_number: phoneNumber,
        date_of_birth: dateOfBirth || null,
        house_location: houseLocation,
        faculty,
        department,
        level,
      })
      .eq('id', authUserId);
    setSavingDetails(false);
    setShowCompleteForm(false);
    showToast('Profile updated');
  }

  async function handleAvatarSelect(e) {
    const file = e.target.files[0];
    if (!file || !authUserId) return;

    setUploadingAvatar(true);
    const fileExt = file.name.split('.').pop();
    const fileName = `${authUserId}-${Date.now()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);

    if (uploadError) {
      console.error('Error uploading avatar:', uploadError.message);
      setUploadingAvatar(false);
      return;
    }

    const { data: publicUrlData } = supabase.storage.from('avatars').getPublicUrl(fileName);
    const newUrl = publicUrlData.publicUrl;

    await supabase.from('profiles').update({ avatar_url: newUrl }).eq('id', authUserId);
    setAvatarUrl(newUrl);
    setUploadingAvatar(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 bg-gray-800 text-white text-sm px-4 py-2 rounded-full z-50 shadow-lg">
          {toast}
        </div>
      )}

      <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-800">
        <button onClick={() => navigate('/home')}>
          <ArrowLeft size={22} />
        </button>
        <h1 className="text-lg font-bold">{isOwnProfile ? 'My Profile' : 'Profile'}</h1>
      </div>

      <div className="px-4 py-6 flex flex-col items-center">
        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gray-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
            {avatarUrl ? (
              <img src={avatarUrl} alt={savedName || 'user'} className="w-full h-full object-cover" />
            ) : (
              savedName.charAt(0).toUpperCase() || 'U'
            )}
          </div>
          {isOwnProfile && (
            <label className="absolute bottom-0 right-0 w-7 h-7 bg-blue-600 rounded-full flex items-center justify-center cursor-pointer border-2 border-gray-900">
              <Camera size={13} className="text-white" />
              <input type="file" accept="image/*" onChange={handleAvatarSelect} className="hidden" />
            </label>
          )}
        </div>
        {uploadingAvatar && <p className="text-xs text-gray-500 mb-2">Uploading...</p>}

        {isOwnProfile && editingName ? (
          <div className="flex gap-2 w-full max-w-xs">
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="flex-1 bg-gray-800 rounded-full px-4 py-2 text-sm outline-none"
            />
            <button onClick={saveName} className="text-blue-500 text-sm font-semibold px-2">
              Save
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <p className="text-lg font-semibold">{savedName || 'Student'}</p>
            {isOwnProfile && (
              <button onClick={() => setEditingName(true)} className="text-xs text-blue-500">
                Edit
              </button>
            )}
          </div>
        )}

        {isOwnProfile && (faculty || department || level) && (
          <p className="text-xs text-gray-500 mt-1">
            {[department, faculty, level].filter(Boolean).join(' · ')}
          </p>
        )}

        {isOwnProfile ? (
          <button onClick={handleLogout} className="mt-4 px-4 py-1.5 rounded-full bg-gray-800 text-sm">
            Log Out
          </button>
        ) : (
          <button
            onClick={() => showToast('Messaging coming soon!')}
            className="mt-4 flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-600 text-sm font-semibold"
          >
            <MessageCircle size={15} /> Message
          </button>
        )}
      </div>

      {isOwnProfile && profileIncomplete && !showCompleteForm && (
        <div className="mx-3 mb-4 bg-yellow-900/30 border border-yellow-700 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <p className="text-sm text-yellow-300">Your profile is missing some details.</p>
          <button
            onClick={() => setShowCompleteForm(true)}
            className="text-xs font-semibold bg-yellow-600 text-white px-3 py-1.5 rounded-full flex-shrink-0"
          >
            Complete
          </button>
        </div>
      )}

      {isOwnProfile && showCompleteForm && (
        <div className="mx-3 mb-4 bg-gray-800 rounded-xl p-4 space-y-3">
          <h3 className="text-sm font-semibold text-gray-300">Complete your profile</h3>

          <div>
            <label className="text-xs text-gray-500">Phone number</label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g. 080XXXXXXXX"
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Date of birth</label>
            <input
              type="date"
              value={dateOfBirth}
              onChange={(e) => setDateOfBirth(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">House location</label>
            <input
              type="text"
              value={houseLocation}
              onChange={(e) => setHouseLocation(e.target.value)}
              placeholder="e.g. Hostel block / area"
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1"
            />
          </div>

          <div>
            <label className="text-xs text-gray-500">Faculty</label>
            <select
              value={faculty}
              onChange={(e) => { setFaculty(e.target.value); setDepartment(''); }}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1"
            >
              <option value="">Select faculty</option>
              {Object.keys(FACULTY_DEPARTMENTS).map((f) => (
                <option key={f} value={f}>{f}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Department</label>
            <select
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              disabled={!faculty}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1 disabled:opacity-50"
            >
              <option value="">Select department</option>
              {(FACULTY_DEPARTMENTS[faculty] || []).map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-xs text-gray-500">Level</label>
            <select
              value={level}
              onChange={(e) => setLevel(e.target.value)}
              className="w-full bg-gray-700 rounded-lg px-3 py-2 text-sm outline-none mt-1"
            >
              <option value="">Select level</option>
              {LEVELS.map((l) => (
                <option key={l} value={l}>{l}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <button
              onClick={saveDetails}
              disabled={savingDetails}
              className="flex-1 bg-blue-600 disabled:bg-blue-800 text-white text-sm font-semibold py-2 rounded-lg"
            >
              {savingDetails ? 'Saving...' : 'Save'}
            </button>
            <button
              onClick={() => setShowCompleteForm(false)}
              className="px-4 text-sm text-gray-400"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="px-3 py-2">
        <h2 className="text-sm font-semibold text-gray-400 px-1 mb-2">{isOwnProfile ? 'My Posts' : 'Posts'}</h2>
        {loading && <p className="text-center text-gray-500 py-6">Loading...</p>}
        {!loading && posts.length === 0 && (
          <p className="text-center text-gray-500 py-6">
            {isOwnProfile ? "You haven't posted anything yet." : "This user hasn't posted anything yet."}
          </p>
        )}
        <div className="space-y-3">
          {posts.map((post) => (
            <div key={post.id} className="bg-gray-800 rounded-xl overflow-hidden">
              {post.content && <p className="px-4 py-3 text-sm">{post.content}</p>}
              {post.image_url && post.media_type === 'video' ? (
                <video src={post.image_url} controls playsInline preload="metadata" className="w-full" />
              ) : post.image_url ? (
                <img src={post.image_url} alt="post" className="w-full object-cover" />
              ) : null}
              <p className="px-4 py-2 text-xs text-gray-500">{new Date(post.created_at).toLocaleString()}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
