import { Zone, ZoneStatus } from '@/types/zone'; // Assuming ZoneStatus enum is defined here or imported correctly

// Define a type for the API error response if known, otherwise use a generic one
interface ApiError {
    error?: string;
    code?: string; // For specific error codes like P2003
    message?: string; // Fallback message
}

/**
 * Updates the status of a specific zone.
 * @param zoneId - The ID of the zone to update.
 * @param newStatus - The new status for the zone.
 * @returns The updated zone data (or void/boolean depending on API response).
 * @throws {Error} If the API request fails.
 */
export const updateZoneStatus = async (zoneId: string, newStatus: ZoneStatus): Promise<Zone> => {
    const response = await fetch(`/api/zones/${zoneId}/status`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: newStatus }),
    });

    if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({ message: 'Failed to parse error response' }));
        throw new Error(errorData.error || errorData.message || `Failed to update zone status (${response.status})`);
    }

    // Assuming the API returns the updated zone or some confirmation
    return response.json();
};

/**
 * Deletes a specific zone.
 * @param zoneId - The ID of the zone to delete.
 * @param zoneIdentifier - The unique identifier of the zone (for error messages).
 * @throws {Error} If the API request fails, including specific handling for foreign key constraints.
 */
export const deleteZone = async (zoneId: string, zoneIdentifier: string): Promise<void> => {
    const response = await fetch(`/api/zones/${zoneId}`, {
        method: 'DELETE',
    });

    if (!response.ok) {
        let errorMessage = `Failed to delete zone ${zoneIdentifier} (${response.status})`;
        try {
            const errorData: ApiError = await response.json();
            // Handle specific foreign key constraint error (Prisma P2003)
            if (response.status === 409 && errorData.code === 'P2003') {
                errorMessage = `Невозможно удалить зону "${zoneIdentifier}", так как она используется в бронированиях. Сначала удалите связанные бронирования.`;
            } else {
                errorMessage = errorData.error || errorData.message || errorMessage;
            }
        } catch {
            // Ignore if parsing fails, use the default message
        }
        throw new Error(errorMessage);
    }

    // DELETE requests often return 204 No Content, so no JSON parsing is needed.
};