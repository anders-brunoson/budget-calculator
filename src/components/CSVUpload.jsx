import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import Papa from 'papaparse';
import { Button } from '@/components/ui/button';
import { Upload } from 'lucide-react';

const CSVUpload = ({ onDataUploaded }) => {
  const onDrop = useCallback((acceptedFiles) => {
    const file = acceptedFiles[0];
    Papa.parse(file, {
      header: true,
      complete: (results) => {
        const { data } = results;
        const processedData = processCSVData(data);
        onDataUploaded(processedData);
      },
    });
  }, [onDataUploaded]);

  const { getRootProps, getInputProps } = useDropzone({ 
    onDrop, 
    accept: '.csv',
    noClick: true, // Disable click events on the root element
    noKeyboard: true // Disable keyboard events on the root element
  });

  const processCSVData = (data) => {
    // Filter out any rows with empty month or role
    const validData = data.filter(row => row.month && row.role);

    const months = [...new Set(validData.map(row => row.month))];
    const roleNames = [...new Set(validData.map(row => row.role))];
    const roles = roleNames.map((name, index) => ({ id: (index + 1).toString(), name }));
    
    const commitments = {};
    const hourlyRates = {};
    const workingHours = {};
    const workingDays = {};

    roles.forEach(role => {
      commitments[role.id] = {};
      hourlyRates[role.id] = 0;
      workingHours[role.id] = 0;
    });

    validData.forEach(row => {
      const roleId = roles.find(r => r.name === row.role).id;
      commitments[roleId][row.month] = parseInt(row.commitmentLevel);
      hourlyRates[roleId] = parseInt(row.hourlyRate);
      workingHours[roleId] = parseFloat(row.workingHoursPerDay);
      if (!workingDays[row.month]) {
        workingDays[row.month] = Math.round(parseInt(row.hours) / (parseFloat(row.workingHoursPerDay) * parseInt(row.commitmentLevel) / 100));
      }
    });

    return { months, roles, commitments, hourlyRates, workingHours, workingDays };
  };

  return (
    <div {...getRootProps()}>
      <input {...getInputProps()} />
      <Button className="flex items-center" onClick={() => document.querySelector('input[type="file"]').click()}>
        <Upload className="mr-2 h-4 w-4" />
        Upload CSV
      </Button>
    </div>
  );
};

export default CSVUpload;