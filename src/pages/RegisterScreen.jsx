import React, { useState, useEffect } from 'react';
import './RegisterScreen.css';
import { useNavigate } from 'react-router-dom';

const TALUKA_URL = 'https://rslsolution.com/mandap-api/api/admin/new_tal.php';
const SERVICE_URL = 'https://rslsolution.com/mandap-api/api/admin/new_serv.php';
const REGISTER_URL = 'https://rslsolution.com/mandap-api/api/admin/register.php';

export default function RegisterScreen() {
  const [form, setForm] = useState({
    company_name: '',
    poc_name: '',
    address: '',
    taluka_id: '',
    email: '',
    contact_number: '',
    password: '',
  });
  const navigate = useNavigate();

  const [talukas, setTalukas] = useState([]);
  const [services, setServices] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchFiltersData();
  }, []);

  const handleInput = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchFiltersData = async () => {
    try {
      const [talukaRes, serviceRes] = await Promise.all([
        fetch(TALUKA_URL),
        fetch(SERVICE_URL),
      ]);

      const talukaData = await talukaRes.json();
      const serviceData = await serviceRes.json();

      setTalukas(talukaData);
      setServices(serviceData);
    } catch (error) {
      alert('Failed to fetch taluka/services data.');
    }
  };

  const toggleService = (id) => {
    setSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const validateForm = () => {
    for (let key in form) {
      if (!form[key]) {
        if (key === 'company_name') {
          alert('Firm name is required');
        } else {
          alert(`${key.replace(/_/g, ' ')} is required`);
        }
        return false;
      }
    }
    if (selectedServices.length === 0) {
      alert('Please select at least one service');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      console.log('Form values:', form);
      console.log('Selected services:', selectedServices);
      
      const payload = {
        company_data: {
          company_name: form.company_name,
          poc_name: form.poc_name,
          address: form.address,
          taluka_id: parseInt(form.taluka_id),
          email: form.email,
          contact_number: form.contact_number,
          password: form.password
        },
        service_ids: selectedServices
      };
      
      console.log('Payload being sent:', payload);

      // Send POST request with JSON data
      const res = await fetch(REGISTER_URL, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status);
      console.log('Response headers:', res.headers);
      
      const responseText = await res.text();
      console.log('Raw response:', responseText);
      
      let result;
      try {
        result = JSON.parse(responseText);
        console.log('Parsed API Response:', result);
      } catch (parseError) {
        console.log('JSON parse error:', parseError);
        throw new Error(`Server response is not valid JSON: ${responseText}`);
      }

      if (!res.ok || !result.success) {
        throw new Error(result.message || 'Registration failed');
      }

      alert('Registration successful! Company has been registered.');
      navigate('/home', { state: { token: 'dummy-static-token', fromRegistration: true } });
    } catch (error) {
      alert(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="register-screen">
      <div className="register-container">
        <h2>Register</h2>

        {Object.entries(form).map(([key, value]) => {
          if (key === 'taluka_id') return null;
          return (
            <input
              key={key}
              className="form-input"
              placeholder={
                key === 'poc_name'
                  ? 'Contact name'
                  : key === 'company_name'
                    ? 'Firm name'
                    : key.replace(/^\w/, (c) => c.toUpperCase())
              }
              value={value}
              onChange={(e) => handleInput(key, e.target.value)}
              type={key === 'password' ? 'password' : key === 'contact_number' ? 'tel' : 'text'}
            />
          );
        })}

        <select
          value={form.taluka_id}
          onChange={(e) => handleInput('taluka_id', e.target.value)}
          className="form-select"
        >
          <option value="">-- Select Taluka --</option>
          {talukas.map((t) => (
            <option key={t.id} value={t.id}>{t.name}</option>
          ))}
        </select>

        <label className="form-label">Select Services</label>
        <div className="service-list">
          {services.map((service) => (
            <label key={service.id} className="service-checkbox">
              <input
                type="checkbox"
                checked={selectedServices.includes(service.id)}
                onChange={() => toggleService(service.id)}
              />
              <span>{service.name}</span>
            </label>
          ))}
        </div>

        <button 
          className="btn btn-primary" 
          onClick={handleRegister}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Registering...' : 'Register'}
        </button>
        <button className="btn btn-secondary" onClick={() => navigate('/login')}>
          Back to Login
        </button>
      </div>
    </div>
  );
}
