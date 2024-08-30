import React, { useState, useEffect, useRef } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, GripVertical, Moon, Sun, Info, Download } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BudgetCalculator = () => {
  const [months, setMonths] = useState(['jan', 'feb', 'mar',`apr`,'may', 'jun', 'jul',`aug`,'sep', 'oct', 'nov',`dec`]);
  const [roles, setRoles] = useState([
    { id: '1', name: 'Systems Developer BE' },
    { id: '2', name: 'Systems Developer FE' },
    { id: '3', name: 'UX Designer' },
    { id: '4', name: 'Digital Designer' },
    { id: '5', name: 'Project Manager' }
  ]);

  const [commitments, setCommitments] = useState({});
  const [hourlyRates, setHourlyRates] = useState({});
  const [workingDays, setWorkingDays] = useState({});
  const [workingHours, setWorkingHours] = useState({});
  const [budget, setBudget] = useState({});
  const [newMonthName, setNewMonthName] = useState('');
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);
  const [darkMode, setDarkMode] = useState(false);
  const [isInfoOpen, setIsInfoOpen] = useState(false);
  const [editingMonth, setEditingMonth] = useState(null);
  const editInputRef = useRef(null);
  const [monthOrder, setMonthOrder] = React.useState([]);  

  useEffect(() => {
    initializeState();
  }, []);

  useEffect(() => {
    if (months.length > 0 && !months.includes(activeTab)) {
      setActiveTab(months[0]);
    }
  }, [months, activeTab]);

  useEffect(() => {
    document.body.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const initializeState = () => {
    const initialCommitments = {};
    const initialHourlyRates = {};
    const initialWorkingDays = {};
    const initialWorkingHours = {};

    roles.forEach(role => {
      initialCommitments[role.id] = {};
      initialHourlyRates[role.id] = 1000;
      initialWorkingHours[role.id] = 8;  // Set default working hours to 8
      months.forEach(month => {
        initialCommitments[role.id][month] = 50;
        initialWorkingDays[month] = 21;
      });
    });

    setCommitments(initialCommitments);
    setHourlyRates(initialHourlyRates);
    setWorkingDays(initialWorkingDays);
    setWorkingHours(initialWorkingHours);  // Set the initial working hours
    setActiveTab(months[0]);
    setMonthOrder(months);
  };

  useEffect(() => {
    calculateBudget();
  }, [commitments, hourlyRates, roles, workingDays, workingHours, months]);

  const calculateBudget = () => {
    const newBudget = {};
    let grandTotal = 0;
    const grandTotalBreakdown = {};
    const grandTotalHours = {};
    const grandTotalCommitments = {};

    months.forEach(month => {
      newBudget[month] = { total: 0, breakdown: {}, hours: {}, commitments: {} };
      roles.forEach(role => {
        const commitment = commitments[role.id]?.[month] || 0;
        const days = workingDays[month] || 0;
        const hoursPerDay = workingHours[role.id] === '' ? 0 : (workingHours[role.id] ?? 8);
        const hours = Math.round(days * hoursPerDay * commitment / 100);
        const amount = hours * (hourlyRates[role.id] || 0);
        newBudget[month].breakdown[role.id] = amount;
        newBudget[month].hours[role.id] = hours;
        newBudget[month].commitments[role.id] = commitment;
        newBudget[month].total += amount;

        grandTotalBreakdown[role.id] = (grandTotalBreakdown[role.id] || 0) + amount;
        grandTotalHours[role.id] = (grandTotalHours[role.id] || 0) + hours;
        grandTotalCommitments[role.id] = (grandTotalCommitments[role.id] || 0) + commitment;
      });
      grandTotal += newBudget[month].total;
    });

    Object.keys(grandTotalCommitments).forEach(roleId => {
      grandTotalCommitments[roleId] = Math.round(grandTotalCommitments[roleId] / months.length);
    });

    newBudget.total = { 
      total: grandTotal, 
      breakdown: grandTotalBreakdown,
      hours: grandTotalHours,
      commitments: grandTotalCommitments
    };
    
    setBudget(newBudget);
  };

  const handleCommitmentChange = (roleId, month, value) => {
    const monthsToUpdate = selectedMonths.length > 0 ? selectedMonths : [month];
    setCommitments(prev => {
      const newCommitments = { ...prev };
      monthsToUpdate.forEach(m => {
        newCommitments[roleId] = { ...newCommitments[roleId], [m]: value[0] };
      });
      return newCommitments;
    });
  };

  const handleHourlyRateChange = (roleId, value) => {
    setHourlyRates(prev => ({ ...prev, [roleId]: value === '' ? '' : parseInt(value) || 0 }));
  };

  const handleWorkingDaysChange = (month, value) => {
    setWorkingDays(prev => ({ ...prev, [month]: value === '' ? '' : parseInt(value) || 0 }));
  };

  const handleWorkingHoursChange = (roleId, value) => {
    const parsedValue = value === '' ? '' : parseFloat(value);
    setWorkingHours(prev => ({ ...prev, [roleId]: parsedValue }));
  };

  const handleAddRole = () => {
    const newId = (roles.length + 1).toString();
    setRoles(prev => [...prev, { id: newId, name: `New Role ${newId}` }]);
    setCommitments(prev => ({
      ...prev,
      [newId]: months.reduce((acc, month) => ({ ...acc, [month]: 50 }), {})
    }));
    setHourlyRates(prev => ({ ...prev, [newId]: 1000 }));
    setWorkingHours(prev => ({ ...prev, [newId]: 8 }));
  };

  const handleRemoveRole = (idToRemove) => {
    setRoles(prev => prev.filter(role => role.id !== idToRemove));
    setCommitments(prev => {
      const { [idToRemove]: _, ...rest } = prev;
      return rest;
    });
    setHourlyRates(prev => {
      const { [idToRemove]: _, ...rest } = prev;
      return rest;
    });
    setWorkingHours(prev => {
      const { [idToRemove]: _, ...rest } = prev;
      return rest;
    });
  };

  const handleAddMonth = () => {
    setIsAddingMonth(true);
  };

  const confirmAddMonth = () => {
    if (newMonthName && !months.includes(newMonthName.toLowerCase())) {
      const monthToAdd = newMonthName.toLowerCase();
      setMonths(prev => [...prev, monthToAdd]);
      setMonthOrder(prev => [...prev, monthToAdd]);
      setWorkingDays(prev => ({ ...prev, [monthToAdd]: 21 }));
      setCommitments(prev => {
        const newCommitments = { ...prev };
        Object.keys(newCommitments).forEach(roleId => {
          newCommitments[roleId][monthToAdd] = 50;
        });
        return newCommitments;
      });
      setNewMonthName('');
      setIsAddingMonth(false);
    }
  };

  const handleRemoveMonth = () => {
    if (months.length > 1 && selectedMonths.length > 0) {
      setMonths(prev => prev.filter(month => !selectedMonths.includes(month)));
      setMonthOrder(prev => prev.filter(month => !selectedMonths.includes(month)));
      setWorkingDays(prev => {
        const newWorkingDays = { ...prev };
        selectedMonths.forEach(month => {
          delete newWorkingDays[month];
        });
        return newWorkingDays;
      });
      setCommitments(prev => {
        const newCommitments = { ...prev };
        Object.keys(newCommitments).forEach(roleId => {
          selectedMonths.forEach(month => {
            delete newCommitments[roleId][month];
          });
        });
        return newCommitments;
      });
      setSelectedMonths([]);
      setActiveTab(months.find(month => !selectedMonths.includes(month)) || months[0]);
    }
  };

  const handleMonthSelect = (month, event) => {
    if (event.ctrlKey || event.metaKey) {
      setSelectedMonths(prev => 
        prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
      );
    } else {
      setSelectedMonths([month]);
    }
    setActiveTab(month);
  };

  const handleMonthDoubleClick = (month) => {
    setEditingMonth(month);
    // Use setTimeout to ensure the input is rendered before trying to focus and select
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 0);
  };
  
  const handleMonthNameChange = (oldName, newName) => {
    if (newName && newName !== oldName && !months.includes(newName.toLowerCase())) {
      const lowerNewName = newName.toLowerCase();
      setMonths(prev => prev.map(m => m === oldName ? lowerNewName : m));
      setMonthOrder(prev => prev.map(m => m === oldName ? lowerNewName : m));
      setWorkingDays(prev => {
        const { [oldName]: value, ...rest } = prev;
        return { ...rest, [lowerNewName]: value };
      });
      setCommitments(prev => {
        const newCommitments = { ...prev };
        Object.keys(newCommitments).forEach(roleId => {
          const { [oldName]: value, ...rest } = newCommitments[roleId];
          newCommitments[roleId] = { ...rest, [lowerNewName]: value };
        });
        return newCommitments;
      });
      setEditingMonth(null);
      
      // Set the active tab to the newly renamed month
      setActiveTab(lowerNewName);
      
      // Update selected months if the renamed month was selected
      setSelectedMonths(prev => prev.map(m => m === oldName ? lowerNewName : m));

      // Force a re-render to ensure the tab becomes active
      setTimeout(() => {
        setActiveTab(lowerNewName);
      }, 0);
    } else {
      setEditingMonth(null);
    }
  };

  useEffect(() => {
    if (editingMonth && editInputRef.current) {
      editInputRef.current.focus();
    }
  }, [editingMonth]);

  useEffect(() => {
    if (selectedMonths.length > 0) {
      setActiveTab(selectedMonths[selectedMonths.length - 1]);
    } else {
      setActiveTab('');
    }
  }, [selectedMonths]);  

  const handleDownloadCSV = () => {
    const csvContent = generateCSV(budget, roles, months, commitments, hourlyRates, workingDays);
    downloadCSV(csvContent);
  };

  const onDragStart = (e, index) => {
    setDraggedItem(roles[index]);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/html", e.target.parentNode);
    e.dataTransfer.setDragImage(e.target.parentNode, 20, 20);
  };

  const onDragOver = (index) => {
    const draggedOverItem = roles[index];

    if (draggedItem === draggedOverItem) {
      return;
    }

    let newRoles = roles.filter(role => role !== draggedItem);

    newRoles.splice(index, 0, draggedItem);

    setRoles(newRoles);
  };

  const onDragEnd = () => {
    setDraggedItem(null);
  };

  const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
  };

  const InfoModal = () => (
  <Dialog open={isInfoOpen} onOpenChange={setIsInfoOpen}>
    <DialogContent>
      <DialogHeader>
        <DialogTitle>How to Use the Budget Calculator</DialogTitle>
      </DialogHeader>
      <DialogDescription>
        <ol className="list-decimal list-inside space-y-2">
          <li>Add or remove roles using the "Add Role" and "X" buttons.</li>
          <li>Add or remove months using the "Add Month" and "Remove Month" buttons.</li>
          <li>Duoble-click month in the tabs section at the top to edit it.</li> 
          <li>Ctrl/command + click to select multiple months to apply commitment level changes across them.</li>
          <li>Verify the number of working days for each month.</li>
          <li>Set the commitment percentage and hourly rate for each role.</li>
          <li>Drag and drop roles to reorder them.</li>
          <li>Use the dark mode toggle for different viewing options.</li>
          <li>View the calculated budget breakdown for each month and the total.</li>
          <li>Download budget data as CSV to use with Excel.</li>
        </ol>
      </DialogDescription>
    </DialogContent>
  </Dialog>
);

  const generateCSV = (budget, roles, months, commitments, hourlyRates, workingDays) => {
    let csvContent = "month;role;commitmentLevel;hourlyRate;workingHoursPerDay;hours;amount\n";

    months.forEach(month => {
      roles.forEach(role => {
        const commitment = commitments[role.id]?.[month] || 0;
        const hourlyRate = hourlyRates[role.id] || 0;
        const days = workingDays[month] || 21;
        const workingHoursPerDay = workingHours[role.id] || 8; // Updated to use 8 as default
        const hours = Math.round(days * workingHoursPerDay * commitment / 100);
        const amount = budget[month]?.breakdown?.[role.id] || 0;

        csvContent += `"${month}";"${role.name}";"${commitment}";"${hourlyRate}";"${workingHoursPerDay}";"${hours}";"${amount}"\n`;
      });
    });

    return csvContent;
  };

  const downloadCSV = (csvContent) => {
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "budget_data.csv");
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className={`p-4 max-w-4xl mx-auto ${darkMode ? 'dark' : ''}`}>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Monthly Budget Calculator</h1>
        <div className="flex items-center space-x-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsInfoOpen(true)}
            className="text-gray-500 hover:text-gray-700"
          >
            <Info className="h-5 w-5" />
          </Button>
          <Sun className="h-4 w-4" />
          <Switch
            checked={darkMode}
            onCheckedChange={toggleDarkMode}
            aria-label="Toggle dark mode"
          />
          <Moon className="h-4 w-4" />
        </div>
      </div>
      
      <div className="mb-4 flex flex-wrap gap-2">
        <Button onClick={handleAddRole} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Role
        </Button>
        <Button onClick={handleAddMonth} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Month
        </Button>
        <Button 
          onClick={handleRemoveMonth} 
          variant="destructive"
          className="flex items-center"
          disabled={months.length <= 1 || selectedMonths.length === 0}
        >
          <X className="mr-2 h-4 w-4" /> Remove Month(s)
        </Button>
        <Button onClick={handleDownloadCSV} className="flex items-center">
          <Download className="mr-2 h-4 w-4" /> Download CSV
        </Button>
      </div>

      {isAddingMonth && (
        <div className="mb-4 flex space-x-2">
          <Input
            value={newMonthName}
            onChange={(e) => setNewMonthName(e.target.value)}
            placeholder="Enter new month name"
          />
          <Button onClick={confirmAddMonth}>Confirm</Button>
          <Button onClick={() => setIsAddingMonth(false)} variant="outline">Cancel</Button>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 bg-gray-100 p-1 rounded-lg flex flex-wrap min-h-fit">
          <TabsList className="w-full flex flex-wrap justify-start bg-transparent">
            {months.map(month => (
              <TabsTrigger 
                key={month} 
                value={month} 
                onClick={(e) => handleMonthSelect(month, e)}
                onDoubleClick={() => handleMonthDoubleClick(month)}
                className={`px-1 py-1 border-b-2 ${
                  selectedMonths.includes(month) 
                    ? 'border-blue-500 bg-blue-100' 
                    : 'border-transparent hover:border-gray-300'
                } focus:outline-none`}
              >
                {editingMonth === month ? (
                  <Input
                    ref={editInputRef}
                    defaultValue={capitalize(month)}
                    onBlur={(e) => handleMonthNameChange(month, e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleMonthNameChange(month, e.target.value);
                      }
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="w-20 p-0 h-6 text-center"
                  />
                ) : (
                  capitalize(month)
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        <div className="mt-4 text-left">
          <h3 className="font-semibold">Selected Month(s):</h3>
          <p>{selectedMonths.map(capitalize).join(', ') || 'None'}</p>
        </div>

        {selectedMonths.length > 0 && (
          <>
            {months.map(month => (
              <TabsContent key={month} value={month}>
                <div className="mt-8 mb-8 flex justify-between items-center">
                  <label className="block text-sm font-medium">
                    Working days in {capitalize(month)} (CHECK MANUALLY!):
                    <Input
                      type="number"
                      value={workingDays[month] ?? ''}
                      onChange={(e) => handleWorkingDaysChange(month, e.target.value)}
                      className="mt-1 block w-full"
                      min="0"
                      max="31"
                    />
                  </label>
                </div>
                <div className="space-y-4 mb-6">
                  {roles.map((role, index) => (
                    <div
                      key={role.id}
                      className="p-4 border rounded-lg relative"
                      draggable
                      onDragStart={(e) => onDragStart(e, index)}
                      onDragOver={() => onDragOver(index)}
                      onDragEnd={onDragEnd}
                    >
                      <div className="flex items-center mb-2">
                        <div className="mr-2 cursor-move">
                          <GripVertical className="h-5 w-5 text-gray-400" />
                        </div>
                        <Input
                          value={role.name}
                          onChange={(e) => setRoles(prev => prev.map(r => r.id === role.id ? { ...r, name: e.target.value } : r))}
                          className="font-medium flex-grow"
                        />
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="ml-2" 
                          onClick={() => handleRemoveRole(role.id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                      <div className="flex items-center space-x-4 mt-2">
                        <div className="text-left flex-grow">
                          <span className="text-sm">Commitment: {commitments[role.id]?.[month] || 0}%</span>
                          <Slider
                            value={[commitments[role.id]?.[month] || 0]}
                            max={100}
                            step={1}
                            onValueChange={(val) => handleCommitmentChange(role.id, month, val)}
                          />
                        </div>
                        <div className="w-32">
                          <span className="text-sm">Hourly Rate</span>
                          <Input
                            type="number"
                            value={hourlyRates[role.id] ?? ''}
                            onChange={(e) => handleHourlyRateChange(role.id, e.target.value)}
                            className="mt-1"
                          />
                        </div>
                        <div className="w-32">
                          <span className="text-sm">Hours/Day</span>
                          <Input
                            type="number"
                            value={workingHours[role.id] ?? 8}
                            onChange={(e) => handleWorkingHoursChange(role.id, e.target.value)}
                            className="mt-1"
                            step="0.5"
                            min="0"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            ))}
          </>
        )}
      </Tabs>

      {selectedMonths.length === 0 && (
        <div className="mt-8 text-center text-gray-500">
          <p>Please select a month to view and edit budget details.</p>
        </div>
      )}
      
      <div className="space-y-4 mt-6">
        {monthOrder.map((period, index) => {
          const { total, breakdown, hours, commitments } = budget[period] || {};
          return (
            <Card key={index}>
              <CardHeader className="capitalize">
                <div className="flex justify-between items-center">
                  <span>{period}</span>
                  <span className="text-2xl font-bold">{total?.toLocaleString()} SEK</span>
                </div>
              </CardHeader>
              {breakdown && hours && commitments && (
                <CardContent>
                  <div className="space-y-2">
                    <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                      <span className="col-span-4 text-left">Role</span>
                      <span className="col-span-2 text-right">Commitment</span>
                      <span className="col-span-2 text-right">Hours</span>
                      <span className="col-span-4 text-right">Amount</span>
                    </div>
                    {roles.map(role => (
                      <div key={role.id} className="grid grid-cols-12 gap-2 text-sm">
                        <span className="col-span-4 text-left truncate" title={role.name}>{role.name}</span>
                        <span className="col-span-2 text-right">{commitments[role.id] || 0}%</span>
                        <span className="col-span-2 text-right">{hours[role.id] || 0}</span>
                        <span className="col-span-4 text-right">{(breakdown[role.id] || 0).toLocaleString()} SEK</span>
                      </div>
                    ))}
                    <div className="grid grid-cols-12 gap-2 text-sm font-bold pt-2 border-t">
                      <span className="col-span-4 text-left">Total</span>
                      <span className="col-span-2 text-right">
                        {Object.values(commitments).reduce((sum, value) => sum + (value || 0), 0)}%
                      </span>
                      <span className="col-span-2 text-right">
                        {Object.values(hours).reduce((sum, value) => sum + (value || 0), 0)}
                      </span>
                      <span className="col-span-4 text-right">
                        {Object.values(breakdown).reduce((sum, value) => sum + (value || 0), 0).toLocaleString()} SEK
                      </span>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      <InfoModal />
      
    </div>
  );
};

export default BudgetCalculator;