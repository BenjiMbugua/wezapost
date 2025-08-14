const fs = require('fs');
const path = require('path');

try {
  const tasksPath = path.join(__dirname, '.taskmaster', 'tasks', 'tasks.json');
  const tasksData = JSON.parse(fs.readFileSync(tasksPath, 'utf8'));
  
  console.log('📋 WezaPost Project Tasks\n');
  console.log('=' .repeat(50));
  
  // Access tasks from the master context
  const tasks = tasksData.master.tasks;
  
  tasks.forEach((task, index) => {
    console.log(`\n${index + 1}. ${task.title}`);
    console.log(`   Status: ${task.status}`);
    console.log(`   Priority: ${task.priority}`);
    console.log(`   Description: ${task.description}`);
    
    if (task.subtasks && task.subtasks.length > 0) {
      console.log(`   Subtasks:`);
      task.subtasks.forEach((subtask, subIndex) => {
        console.log(`     ${index + 1}.${subIndex + 1} ${subtask.title}`);
        console.log(`        Status: ${subtask.status}`);
        console.log(`        Priority: ${subtask.priority}`);
      });
    }
    console.log('');
  });
  
  console.log(`Total tasks: ${tasks.length}`);
  
} catch (error) {
  console.error('Error reading tasks:', error.message);
} 