import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

  const [verifyMethod, setVerifyMethod] = useState('email');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
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

    if (verifyMethod === 'phone') {
      setError('Phone verification is coming soon — please use email for now.');
      return;
    }

    setLoading(true);

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

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
    <div className="min-h-screen bg-gradient-to-b from-blue-950 to-slate-900 text-white flex flex-col justify-center px-6 py-10">
      <div className="max-w-sm mx-auto w-full">
        <h1 className="text-3xl font-bold text-center mb-1">
          {step === 1 && 'Create your account'}
          {step === 2 && 'Verify your email'}
          {step === 3 && 'Almost done'}
        </h1>
        <p className="text-blue-300 text-center mb-8">
          {step === 1 && 'Join your campus community'}
          {step === 2 && `Enter the code sent to ${email}`}
          {step === 3 && 'Tell us a bit more about you'}
        </p>

        {error && (
          <div className="bg-red-900/40 border border-red-700 text-red-300 text-sm rounded-lg px-4 py-2 mb-4">
            {error}
          </div>
        )}

        {step === 1 && (
          <form onSubmit={handleStep1Submit} className="space-y-4">
            <div className="flex gap-2 mb-2">
              <button
                type="button"
                onClick={() => setVerifyMethod('email')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${verifyMethod === 'email' ? 'bg-white text-blue-950' : 'bg-blue-900/50 text-blue-300'}`}
              >
                Email
              </button>
              <button
                type="button"
                onClick={() => setVerifyMethod('phone')}
                className={`flex-1 py-2 rounded-lg text-sm font-semibold ${verifyMethod === 'phone' ? 'bg-white text-blue-950' : 'bg-blue-900/50 text-blue-300'}`}
              >
                Phone (soon)
              </button>
            </div>

            <div className="flex gap-3">
              <div className="flex-1">
                <label className="text-sm text-blue-300">First Name</label>
                <input
                  type="text"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white placeholder-blue-400 outline-none"
                  placeholder="First name"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm text-blue-300">Last Name</label>
                <input
                  type="text"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white placeholder-blue-400 outline-none"
                  placeholder="Last name"
                />
              </div>
            </div>

            <div>
              <label className="text-sm text-blue-300">University Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white placeholder-blue-400 outline-none"
                placeholder="you@university.edu"
              />
            </div>

            <div>
              <label className="text-sm text-blue-300">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white placeholder-blue-400 outline-none"
                placeholder="At least 6 characters"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white disabled:bg-blue-300 text-blue-950 font-bold py-3 rounded-full mt-2"
            >
              {loading ? 'Please wait...' : 'Continue'}
            </button>

            <p className="text-center text-blue-300 text-sm mt-4">
              Already have an account?{' '}
              <a href="/login" className="underline font-semibold">Log in</a>
            </p>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="space-y-4">
            <div>
              <label className="text-sm text-blue-300">6-digit code</label>
              <input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white text-center text-2xl tracking-widest placeholder-blue-400 outline-none"
                placeholder="000000"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white disabled:bg-blue-300 text-blue-950 font-bold py-3 rounded-full mt-2"
            >
              {loading ? 'Verifying...' : 'Verify'}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleFinalSubmit} className="space-y-4">
            <div>
              <label className="text-sm text-blue-300">Faculty</label>
              <select
                value={faculty}
                onChange={(e) => { setFaculty(e.target.value); setDepartment(''); }}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white outline-none"
              >
                <option value="">Select faculty</option>
                {Object.keys(FACULTY_DEPARTMENTS).map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-blue-300">Department</label>
              <select
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                disabled={!faculty}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white outline-none disabled:opacity-50"
              >
                <option value="">Select department</option>
                {(FACULTY_DEPARTMENTS[faculty] || []).map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-blue-300">Level</label>
              <select
                value={level}
                onChange={(e) => setLevel(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white outline-none"
              >
                <option value="">Select level</option>
                {LEVELS.map((l) => (
                  <option key={l} value={l}>{l}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-sm text-blue-300">Date of Birth</label>
              <input
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white outline-none"
              />
            </div>

            <div>
              <label className="text-sm text-blue-300">Where do you stay?</label>
              <div className="flex gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setResidenceType('on_campus')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${residenceType === 'on_campus' ? 'bg-white text-blue-950' : 'bg-blue-900/50 text-blue-300'}`}
                >
                  On Campus
                </button>
                <button
                  type="button"
                  onClick={() => setResidenceType('off_campus')}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold ${residenceType === 'off_campus' ? 'bg-white text-blue-950' : 'bg-blue-900/50 text-blue-300'}`}
                >
                  Off Campus
                </button>
              </div>
            </div>

            <div>
              <label className="text-sm text-blue-300">
                {residenceType === 'on_campus' ? 'Hostel / Room' : 'House Address'}
              </label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-blue-900/40 border border-blue-800 rounded-xl px-4 py-3 mt-1 text-white placeholder-blue-400 outline-none"
                placeholder={residenceType === 'on_campus' ? 'e.g. Block A, Room 12' : 'e.g. No 2 Lucy Alour Street'}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white disabled:bg-blue-300 text-blue-950 font-bold py-3 rounded-full mt-2"
            >
              {loading ? 'Finishing up...' : 'Finish Signup'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
