
const API_URL = 'http://localhost:5000/api';

export const fetchMaterials = async (category, type) => {
    try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (type) params.append('type', type);

        const response = await fetch(`${API_URL}/materials?${params.toString()}`);
        if (!response.ok) {
            throw new Error('Failed to fetch materials');
        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching materials:", error);
        // Return empty array on error to prevent UI crash if backend is offline
        return [];
    }
};

export const addMaterial = async (materialData) => {
    try {
        const response = await fetch(`${API_URL}/materials`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(materialData),
        });
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to add material');
        }
        return await response.json();
    } catch (error) {
        console.error("Error adding material:", error);
        throw error;
    }
};
