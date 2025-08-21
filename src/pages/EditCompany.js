import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

const BASE_URL = 'https://www.rslsolution.com/mandap-api/api/admin/';

const EditCompany = () => {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { company, token } = state || {};

  const [services, setServices] = useState([]);
  const [talukas, setTalukas] = useState([]);

  const [formData, setFormData] = useState({
    company_id: company.id,
    company_name: company.company_name,
    poc_name: company.poc_name,
    contact_number: company.contact_number || '',
    email: company.email || '',
    taluka_id: company.taluka_id || '',
    address: company.address || '',
  });

  const [selectedServices, setSelectedServices] = useState(company.service_ids || []);

  useEffect(() => {
    fetchServices();
    fetchTalukas();
  }, []);

  const fetchServices = async () => {
    try {
      const res = await fetch(BASE_URL + 'new_serv.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setServices(await res.json());
    } catch {
      alert('Failed to fetch services');
    }
  };

  const fetchTalukas = async () => {
    try {
      const res = await fetch(BASE_URL + 'new_tal.php', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTalukas(await res.json());
    } catch {
      alert('Failed to fetch talukas');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleServiceToggle = (serviceId) => {
    setSelectedServices((prev) =>
      prev.includes(serviceId)
        ? prev.filter((id) => id !== serviceId)
        : [...prev, serviceId]
    );
  };

const handleSave = async () => {
  if (!formData.taluka_id) {
    alert("Please select a Taluka.");
    return;
  }

  if (selectedServices.length === 0) {
    alert("Please select at least one service.");
    return;
  }

  try {
    const payload = {
      company_id: formData.company_id,
      company_data: {
        company_name: formData.company_name,
        poc_name: formData.poc_name,
        address: formData.address,
        taluka_id: Number(formData.taluka_id), // ✅ Ensure it's a number
        email: formData.email,
        contact_number: formData.contact_number,
      },
      service_ids: selectedServices.map((id) => Number(id)), // ✅ Ensure it's an array of numbers
    };

    console.log("Payload Sent:", payload);

    const res = await fetch(BASE_URL + "edit_company.php", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      alert("Company updated successfully!");
      navigate(-1);
    } else {
      const err = await res.json();
      alert(`Failed to update company: ${err.error || err.message}`);
    }
  } catch (err) {
    alert("Error updating company");
    console.error(err);
  }
};



  return (
    <div style={styles.pageWrapper}>
      <div style={styles.container}>
        <h2 style={styles.title}>Edit Company</h2>

        <label style={styles.label}>Company Name</label>
        <input
          style={styles.input}
          name="company_name"
          value={formData.company_name}
          onChange={handleChange}
        />

        <label style={styles.label}>POC Name</label>
        <input
          style={styles.input}
          name="poc_name"
          value={formData.poc_name}
          onChange={handleChange}
        />

        <label style={styles.label}>Contact Number</label>
        <input
          style={styles.input}
          name="contact_number"
          value={formData.contact_number}
          onChange={handleChange}
        />

        <label style={styles.label}>Email</label>
        <input
          style={styles.input}
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />

        <label style={styles.label}>Address</label>
        <input
          style={styles.input}
          name="address"
          value={formData.address}
          onChange={handleChange}
        />

        <label style={styles.label}>Taluka</label>
        <select
          style={styles.input}
          name="taluka_id"
          value={formData.taluka_id}
          onChange={handleChange}
        >
          <option value="">Select Taluka</option>
          {talukas.map((t) => (
            <option key={t.id} value={t.id}>
              {t.name}
            </option>
          ))}
        </select>

        <label style={styles.label}>Services</label>
        <div style={styles.checkboxContainer}>
          {services.map((service) => (
            <label key={service.id} style={styles.checkboxLabel}>
              <input
                type="checkbox"
                checked={selectedServices.includes(parseInt(service.id))}
                onChange={() => handleServiceToggle(parseInt(service.id))}
              />
              {service.name}
            </label>
          ))}
        </div>

        <div style={styles.buttonGroup}>
          <button style={styles.saveButton} onClick={handleSave}>
            Save
          </button>
          <button style={styles.cancelButton} onClick={() => navigate(-1)}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #FF7F50, #FFEC4E)',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    // width: '600px',
    // background: '#fff',
    // borderRadius: '10px',
    // padding: '30px',
    // boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
    // fontFamily: 'Arial, sans-serif',

      width: '65%',            // ✅ Expands width more dynamically
  maxWidth: '1400px',      // ✅ Increased from 1200px to 1400px
  margin: '40px auto',     // ✅ Adds top & bottom margin (40px)
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '12px',
  padding: '40px 30px',    // ✅ Top & Bottom padding increased to 40px
  boxShadow: '0 6px 14px rgba(0,0,0,0.12)',
  fontFamily: 'Roboto, sans-serif',
  },
  title: { textAlign: 'center', marginBottom: '20px', color: '#333' },
  label: { display: 'block', marginTop: '10px', fontWeight: 'bold', color: '#444' },
  input: {
    width: '100%',
    padding: '8px',
    marginTop: '5px',
    borderRadius: '6px',
    border: '1px solid #ccc',
  },
  checkboxContainer: {
    maxHeight: '150px',
    overflowY: 'auto',
    border: '1px solid #ccc',
    borderRadius: '6px',
    padding: '5px',
    marginTop: '5px',
  },
  checkboxLabel: { display: 'block', marginBottom: '6px', fontSize: '14px' },
  buttonGroup: { marginTop: '15px', display: 'flex', gap: '10px', justifyContent: 'center' },
  saveButton: {
    background: '#f39f21ff',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
  cancelButton: {
    background: '#9e9e9e',
    color: '#fff',
    border: 'none',
    padding: '8px 15px',
    borderRadius: '5px',
    cursor: 'pointer',
  },
};

export default EditCompany;
