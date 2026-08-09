import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Mail, Lock, User, Eye, EyeOff } from 'lucide-react';

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

export default function Signup() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [otpCode, setOtpCode] = useState('');

  const [faculty, setFaculty] = useState('');
  const [department, setDepartment] = useState('');
  const [level, setLevel] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  const [residenceType, setResidenceType] = useState('on_campus');
  const [address, setAddress] = useState('');

  async function handleStep1Submit(e) {
    e.preventDefault();
    setError('');

    if (!firstName.trim() || !lastName.trim() || !email.trim() || password.length < 6) {
      setError('Please fill in all fields. Password must be at least 6 characters.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    const { error: otpError } = await supabase.auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    setLoading(false);
    setStep(2);
  }

  async function handleVerifyOtp(e) {
    e.preventDefault();
    setError('');

    if (otpCode.length !== 6) {
      setError('Enter the 6-digit code sent to your email.');
      return;
    }

    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email,
      token: otpCode,
      type: 'email',
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    await supabase.from('profiles').update({
      display_name: `${firstName} ${lastName}`,
      first_name: firstName,
      last_name: lastName,
    }).eq('id', (await supabase.auth.getUser()).data.user.id);

    setLoading(false);
    setStep(3);
  }

  async function handleFinalSubmit(e) {
    e.preventDefault();
    setError('');

    if (!faculty || !department || !level || !dateOfBirth || !address.trim()) {
      setError('Please complete all fields.');
      return;
    }

    setLoading(true);

    const { data: { user } } = await supabase.auth.getUser();

    const { error: updateError } = await supabase.from('profiles').update({
      faculty,
      department,
      level,
      date_of_birth: dateOfBirth,
      residence_type: residenceType,
      house_location: address,
    }).eq('id', user.id);

    setLoading(false);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    navigate('/home');
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white flex flex-col justify-center px-6 py-10 relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 -right-24 w-72 h-72 bg-orange-500/20 rounded-full blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-24 w-80 h-80 bg-fuchsia-600/20 rounded-full blur-3xl" />

      <div className="relative max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-extrabold text-center mb-1 bg-gradient-to-r from-fuchsia-400 via-violet-400 to-orange-300 bg-clip-text text-transparent">
          Uni.hub
        </h1>
        <p className="text-zinc-400 text-center text-sm mb-8">
          Your campus. Your community. Everything in one place.
        </p>

        <div className="bg-zinc-900/80 border border-zinc-800 rounded-3xl p-6 shadow-2xl backdrop-blur">
          <h2 className="text-xl font-bold mb-1">
            {step === 1 && 'Create your account'}
            {step === 2 && 'Verify your email'}
            {step === 3 && 'Almost there'}
          </h2>
          <p className="text-zinc-500 text-sm mb-6">
            {step === 1 && 'Use your university email to join your campus community.'}
            {step === 2 && `Enter the code sent to ${email}`}
            {step === 3 && 'Tell us a bit more about you.'}
          </p>

          {error && (
            <div className="bg-red-900/30 border border-red-800 text-red-300 text-sm rounded-xl px-4 py-2 mb-4">
              {error}
            </div>
          )}

          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="text-xs text-zinc-400 font-medium">First Name</label>
                  <div className="relative mt-1">
                    <User size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="First name"
                      className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl pl-10 pr-3 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <label className="text-xs text-zinc-400 font-medium">Last Name</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                    className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-3 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors mt-1"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">University Email</label>
                <div className="relative mt-1">
                  <Mail size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@university.edu"
                    className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Password</label>
                <div className="relative mt-1">
                  <Lock size={17} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 6 characters"
                    className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl pl-10 pr-10 py-3 text-sm text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600"
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg mt-2"
              >
                {loading ? 'Please wait...' : 'Continue'}
              </button>

              <p className="text-center text-sm text-zinc-500 mt-4">
                Already have an account?{' '}
                <a href="/login" className="text-fuchsia-400 font-semibold">Log in</a>
              </p>
            </form>
          )}

          {step === 2 && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium">6-digit code</label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white text-center text-2xl tracking-widest placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                  placeholder="000000"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg mt-2"
              >
                {loading ? 'Verifying...' : 'Verify'}
              </button>
            </form>
          )}

          {step === 3 && (
            <form onSubmit={handleFinalSubmit} className="space-y-4">
              <div>
                <label className="text-xs text-zinc-400 font-medium">Faculty</label>
                <select
                  value={faculty}
                  onChange={(e) => { setFaculty(e.target.value); setDepartment(''); }}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white outline-none focus:border-fuchsia-500 transition-colors"
                >
                  <option value="">Select faculty</option>
                  {Object.keys(FACULTY_DEPARTMENTS).map((f) => (
                    <option key={f} value={f}>{f}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Department</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  disabled={!faculty}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white outline-none disabled:opacity-50 focus:border-fuchsia-500 transition-colors"
                >
                  <option value="">Select department</option>
                  {(FACULTY_DEPARTMENTS[faculty] || []).map((d) => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Level</label>
                <select
                  value={level}
                  onChange={(e) => setLevel(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white outline-none focus:border-fuchsia-500 transition-colors"
                >
                  <option value="">Select level</option>
                  {LEVELS.map((l) => (
                    <option key={l} value={l}>{l}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Date of Birth</label>
                <input
                  type="date"
                  value={dateOfBirth}
                  onChange={(e) => setDateOfBirth(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white outline-none focus:border-fuchsia-500 transition-colors"
                />
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">Where do you stay?</label>
                <div className="flex gap-2 mt-1">
                  <button
                    type="button"
                    onClick={() => setResidenceType('on_campus')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${residenceType === 'on_campus' ? 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white' : 'bg-zinc-800/70 border border-zinc-700 text-zinc-400'}`}
                  >
                    On Campus
                  </button>
                  <button
                    type="button"
                    onClick={() => setResidenceType('off_campus')}
                    className={`flex-1 py-2 rounded-xl text-sm font-semibold transition-colors ${residenceType === 'off_campus' ? 'bg-gradient-to-r from-fuchsia-500 to-orange-400 text-white' : 'bg-zinc-800/70 border border-zinc-700 text-zinc-400'}`}
                  >
                    Off Campus
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-zinc-400 font-medium">
                  {residenceType === 'on_campus' ? 'Hostel / Room' : 'House Address'}
                </label>
                <input
                  type="text"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full bg-zinc-800/70 border border-zinc-700 rounded-xl px-4 py-3 mt-1 text-white placeholder-zinc-500 outline-none focus:border-fuchsia-500 transition-colors"
                  placeholder={residenceType === 'on_campus' ? 'e.g. Block A, Room 12' : 'e.g. No 2 Lucy Alour Street'}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-fuchsia-500 to-orange-400 disabled:opacity-50 text-white font-semibold py-3 rounded-xl shadow-lg mt-2"
              >
                {loading ? 'Finishing up...' : 'Finish Signup'}
              </button>
            </form>
          )}
        </div>

        {step === 1 && (
          <div className="text-center mt-8">
            <p className="text-sm text-zinc-400 mb-1">🏫 Connect with your campus</p>
            <p className="text-xs text-zinc-600">Discover students · Events · Marketplace · Errands</p>
          </div>
        )}
      </div>
    </div>
  );
}
