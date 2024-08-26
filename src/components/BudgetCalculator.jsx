import React, { useState, useEffect } from 'react';
import { Slider } from '@/components/ui/slider';
import { Card, CardHeader, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { PlusCircle, X, GripVertical } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

const BudgetCalculator = () => {
  const [months, setMonths] = useState(['jan', 'feb', 'mar',`apr`,'may', 'jun', 'jul',`aug`,'sep', 'oct', 'nov',`dec`]);
  const [roles, setRoles] = useState([
    { id: '1', name: 'Systems Developer' },
    { id: '2', name: 'Project Manager' },
    { id: '3', name: 'Content Manager' }
  ]);

  const [commitments, setCommitments] = useState({});
  const [hourlyRates, setHourlyRates] = useState({});
  const [workingDays, setWorkingDays] = useState({});
  const [budget, setBudget] = useState({});
  const [newMonthName, setNewMonthName] = useState('');
  const [isAddingMonth, setIsAddingMonth] = useState(false);
  const [selectedMonths, setSelectedMonths] = useState([]);
  const [activeTab, setActiveTab] = useState('');
  const [draggedItem, setDraggedItem] = useState(null);

  useEffect(() => {
    initializeState();
  }, []);

  useEffect(() => {
    if (months.length > 0 && !months.includes(activeTab)) {
      setActiveTab(months[0]);
    }
  }, [months, activeTab]);

  const initializeState = () => {
    const initialCommitments = {};
    const initialHourlyRates = {};
    const initialWorkingDays = {};

    roles.forEach(role => {
      initialCommitments[role.id] = {};
      initialHourlyRates[role.id] = 1000;
      months.forEach(month => {
        initialCommitments[role.id][month] = 50;
        initialWorkingDays[month] = 21;
      });
    });

    setCommitments(initialCommitments);
    setHourlyRates(initialHourlyRates);
    setWorkingDays(initialWorkingDays);
    setActiveTab(months[0]);
  };

  useEffect(() => {
    calculateBudget();
  }, [commitments, hourlyRates, roles, workingDays, months]);

  const calculateBudget = () => {
    const newBudget = {};
    let grandTotal = 0;

    months.forEach(month => {
      newBudget[month] = { total: 0, breakdown: {}, hours: {} };
      roles.forEach(role => {
        const hours = Math.round((workingDays[month] || 21) * 7.5 * (commitments[role.id]?.[month] || 0) / 100);
        const amount = hours * (hourlyRates[role.id] || 0);
        newBudget[month].breakdown[role.id] = amount;
        newBudget[month].hours[role.id] = hours;
        newBudget[month].total += amount;
      });
      grandTotal += newBudget[month].total;
    });

    newBudget.total = { total: grandTotal };
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
    setHourlyRates(prev => ({ ...prev, [roleId]: parseInt(value) || 0 }));
  };

  const handleWorkingDaysChange = (month, value) => {
    setWorkingDays(prev => ({ ...prev, [month]: parseInt(value) || 0 }));
  };

  const handleAddRole = () => {
    const newId = (roles.length + 1).toString();
    setRoles(prev => [...prev, { id: newId, name: `New Role ${newId}` }]);
    setCommitments(prev => ({
      ...prev,
      [newId]: months.reduce((acc, month) => ({ ...acc, [month]: 50 }), {})
    }));
    setHourlyRates(prev => ({ ...prev, [newId]: 1000 }));
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
  };

  const handleAddMonth = () => {
    setIsAddingMonth(true);
  };

  const confirmAddMonth = () => {
    if (newMonthName && !months.includes(newMonthName.toLowerCase())) {
      const monthToAdd = newMonthName.toLowerCase();
      setMonths(prev => [...prev, monthToAdd]);
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

  const handleRemoveMonth = (monthToRemove) => {
    if (months.length > 1) {
      setMonths(prev => {
        const updatedMonths = prev.filter(month => month !== monthToRemove);
        setActiveTab(updatedMonths[0]);
        return updatedMonths;
      });
      setWorkingDays(prev => {
        const { [monthToRemove]: _, ...rest } = prev;
        return rest;
      });
      setCommitments(prev => {
        const newCommitments = { ...prev };
        Object.keys(newCommitments).forEach(roleId => {
          const { [monthToRemove]: _, ...rest } = newCommitments[roleId];
          newCommitments[roleId] = rest;
        });
        return newCommitments;
      });
      setSelectedMonths(prev => prev.filter(month => month !== monthToRemove));
    }
  };

  const handleMonthSelect = (month) => {
    setSelectedMonths(prev =>
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    );
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

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Monthly Budget Calculator</h1>
      <div className="mb-4 flex space-x-2">
        <Button onClick={handleAddRole} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Role
        </Button>
        <Button onClick={handleAddMonth} className="flex items-center">
          <PlusCircle className="mr-2 h-4 w-4" /> Add Month
        </Button>
        <Button 
          onClick={() => handleRemoveMonth(activeTab)} 
          variant="destructive"
          className="flex items-center"
          disabled={months.length <= 1}
        >
          <X className="mr-2 h-4 w-4" /> Remove Month
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
      <div className="mb-4 flex flex-wrap gap-2">
        {months.map(month => (
          <label key={month} className="flex items-center space-x-2">
            <Checkbox
              checked={selectedMonths.includes(month)}
              onCheckedChange={() => handleMonthSelect(month)}
            />
            <span className="capitalize">{month}</span>
          </label>
        ))}
      </div>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="mb-6 bg-gray-100 p-1 rounded-t-lg">
          <TabsList className="w-full flex flex-wrap justify-start bg-transparent">
            {months.map(month => (
              <TabsTrigger 
                key={month} 
                value={month} 
                className="px-4 py-2 border-b-2 border-transparent hover:border-gray-300 focus:outline-none focus:border-blue-500"
              >
                {capitalize(month)}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>
        {months.map(month => (
          <TabsContent key={month} value={month}>
            <div className="mt-8 mb-8 flex justify-between items-center">
              <label className="block text-sm font-medium text-gray-700">
                Working days in {capitalize(month)} (CHECK MANUALLY!):
                <Input
                  type="number"
                  value={workingDays[month] || 0}
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
                  className="p-4 border rounded-lg relative bg-white"
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
                      <span className="text-sm">Hourly Rate (SEK)</span>
                      <Input
                        type="number"
                        value={hourlyRates[role.id] || 0}
                        onChange={(e) => handleHourlyRateChange(role.id, e.target.value)}
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
      <div className="space-y-4 mt-6">
        {Object.entries(budget).map(([period, { total, breakdown, hours }]) => (
          <Card key={period}>
            <CardHeader className="capitalize">
              <div className="flex justify-between items-center">
                <span>{period}</span>
                <span className="text-2xl font-bold">{total?.toLocaleString()} SEK</span>
              </div>
            </CardHeader>
            {breakdown && hours && (
              <CardContent>
                <div className="space-y-2">
                  <div className="grid grid-cols-12 gap-2 text-sm font-medium">
                    <span className="col-span-6 text-left">Role</span>
                    <span className="col-span-2 text-right">Hours</span>
                    <span className="col-span-4 text-right">Amount</span>
                  </div>
                  {roles.map(role => (
                    <div key={role.id} className="grid grid-cols-12 gap-2 text-sm">
                      <span className="col-span-6 text-left truncate" title={role.name}>{role.name}</span>
                      <span className="col-span-2 text-right">{hours[role.id] || 0}</span>
                      <span className="col-span-4 text-right">{(breakdown[role.id] || 0).toLocaleString()} SEK</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BudgetCalculator;