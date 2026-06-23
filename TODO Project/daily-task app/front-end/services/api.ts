export const apiService = {
    // ডাটাবেস থেকে টাস্কগুলো নিয়ে আসার ফাংশন
    getTasks: async () => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/tasks');
            return await response.json();
        } catch (error) {
            console.error("Error fetching tasks:", error);
            return [];
        }
    },
    
    // ডাটাবেসে নতুন টাস্ক সেভ করার ফাংশন
    addTask: async (taskTitle: string) => {
        try {
            const response = await fetch('http://127.0.0.1:5000/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: taskTitle })
            });
            return await response.json();
        } catch (error) {
            console.error("Error adding task:", error);
        }
    }
};
