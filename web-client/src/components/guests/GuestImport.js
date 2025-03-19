// src/components/guests/GuestImport.js
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { guestService } from '../../services';
import Papa from 'papaparse';

const GuestImport = () => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;
    
    // Check file type
    if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
      setError('Please upload a CSV file');
      setFile(null);
      setPreview([]);
      return;
    }
    
    setFile(selectedFile);
    
    // Parse CSV for preview
    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      preview: 5, // Show first 5 rows
      complete: (results) => {
        if (results.errors.length > 0) {
          setError('Error parsing CSV file');
          console.error('CSV parsing errors:', results.errors);
          return;
        }
        
        setPreview(results.data);
      }
    });
  };

  const handleImport = () => {
    if (!file) {
      setError('Please select a CSV file');
      return;
    }
    
    setError('');
    setSuccess('');
    setLoading(true);
    
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        if (results.errors.length > 0) {
          setError(`Error parsing CSV file: ${results.errors[0].message}`);
          console.error('CSV parsing errors:', results.errors);
          setLoading(false);
          return;
        }
        
        // BUG FIX: Vérification que les données ne sont pas vides
        if (!results.data || results.data.length === 0) {
          setError('CSV file contains no data');
          setLoading(false);
          return;
        }
        
        try {
          // Map CSV data to guest format and validate
          const guests = results.data.map(row => {
            // BUG FIX: Détection plus robuste des colonnes
            const name = row.name || row.Name || row.fullName || row['Full Name'] || '';
            const email = row.email || row.Email || row['E-mail'] || row['Email Address'] || '';
            const phone = row.phone || row.Phone || row['Phone Number'] || row.Mobile || row.Tel || '';
            let category = (row.category || row.Category || 'other').toLowerCase();
            
            // BUG FIX: Validation et normalisation de la catégorie
            if (!['family', 'friends', 'colleagues', 'other'].includes(category)) {
              category = 'other';
            }
            
            return { name, email, phone, category };
          }).filter(guest => {
            // Filter out invalid guests
            const isValid = guest.name && (guest.email || guest.phone);
            return isValid;
          });
          
          if (guests.length === 0) {
            setError('No valid guests found in CSV');
            setLoading(false);
            return;
          }
          
          // Validate and normalize category values
          const normalizedGuests = guests.map(guest => ({
            ...guest,
            category: ['family', 'friends', 'colleagues'].includes(guest.category) 
              ? guest.category 
              : 'other'
          }));
          
          // Import guests
          const response = await guestService.importGuests(normalizedGuests);
          setSuccess(`Successfully imported ${response.guests.length} guests`);
          
          // Reset form
          setFile(null);
          setPreview([]);
          
          // Redirect after 2 seconds
          setTimeout(() => {
            navigate('/guests');
          }, 2000);
        } catch (error) {
          setError(error.response?.data?.message || 'Failed to import guests');
          console.error('Import error:', error);
        } finally {
          setLoading(false);
        }
      }
    });
  };

  const downloadSampleCsv = () => {
    const csvContent = `name,email,phone,category
John Doe,john@example.com,123-456-7890,family
Jane Smith,jane@example.com,098-765-4321,friends
Bob Johnson,bob@example.com,555-123-4567,colleagues
Alice Brown,alice@example.com,555-987-6543,other`;
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'guest_import_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="guest-import-container">
      <h2>Import Guests</h2>
      
      {error && <div className="error-message">{error}</div>}
      {success && <div className="success-message">{success}</div>}
      
      <div className="import-instructions">
        <h3>Instructions</h3>
        <p>Upload a CSV file with the following columns:</p>
        <ul>
          <li><strong>name</strong> (required): Guest's full name</li>
          <li><strong>email</strong>: Guest's email address</li>
          <li><strong>phone</strong>: Guest's phone number</li>
          <li><strong>category</strong>: Guest category (family, friends, colleagues, or other)</li>
        </ul>
        <p>Either email or phone is required for each guest.</p>
        <button className="sample-button" onClick={downloadSampleCsv}>
          Download Sample CSV
        </button>
      </div>
      
      <div className="import-form">
        <div className="file-input-container">
          <label htmlFor="csv-file">Select CSV File</label>
          <input
            type="file"
            id="csv-file"
            accept=".csv"
            onChange={handleFileChange}
          />
        </div>
        
        {preview.length > 0 && (
          <div className="preview-container">
            <h3>Preview</h3>
            <table className="preview-table">
              <thead>
                <tr>
                  {Object.keys(preview[0]).map(header => (
                    <th key={header}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {preview.map((row, index) => (
                  <tr key={index}>
                    {Object.values(row).map((value, i) => (
                      <td key={i}>{value || '-'}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="preview-note">Showing first {preview.length} rows</p>
          </div>
        )}
        
        <div className="import-actions">
          <button 
            type="button" 
            className="cancel-button" 
            onClick={() => navigate('/guests')}
          >
            Cancel
          </button>
          <button 
            type="button" 
            className="import-button" 
            onClick={handleImport}
            disabled={!file || loading}
          >
            {loading ? 'Importing...' : 'Import Guests'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GuestImport;