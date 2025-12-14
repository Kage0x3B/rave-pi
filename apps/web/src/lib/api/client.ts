import type {
    ApiResponse,
    HealthResponse,
    StateResponse,
    EffectsResponse,
    ScenesResponse,
    SetPowerRequest,
    SetBrightnessRequest,
    SetColorRequest,
    SetEffectRequest,
    SaveSceneRequest,
    EffectParams,
} from '@ravepi/shared-types';

const API_BASE = '/api';

async function request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
        headers: {
            'Content-Type': 'application/json',
        },
        ...options,
    });

    if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
}

export const api = {
    /** Get daemon health/status */
    async getHealth(): Promise<HealthResponse> {
        return request<HealthResponse>('/health');
    },

    /** Get current LED state */
    async getState(): Promise<StateResponse> {
        return request<StateResponse>('/state');
    },

    /** Get available effects */
    async getEffects(): Promise<EffectsResponse> {
        return request<EffectsResponse>('/effects');
    },

    /** Get saved scenes */
    async getScenes(): Promise<ScenesResponse> {
        return request<ScenesResponse>('/scenes');
    },

    /** Set power on/off */
    async setPower(on: boolean): Promise<ApiResponse> {
        return request<ApiResponse>('/power', {
            method: 'POST',
            body: JSON.stringify({ on } satisfies SetPowerRequest),
        });
    },

    /** Set brightness (0-255) */
    async setBrightness(value: number): Promise<ApiResponse> {
        return request<ApiResponse>('/brightness', {
            method: 'POST',
            body: JSON.stringify({ value } satisfies SetBrightnessRequest),
        });
    },

    /** Set base color */
    async setColor(r: number, g: number, b: number): Promise<ApiResponse> {
        return request<ApiResponse>('/color', {
            method: 'POST',
            body: JSON.stringify({ r, g, b } satisfies SetColorRequest),
        });
    },

    /** Set effect */
    async setEffect(name: string, params?: EffectParams): Promise<ApiResponse> {
        return request<ApiResponse>('/effect', {
            method: 'POST',
            body: JSON.stringify({ name, params } satisfies SetEffectRequest),
        });
    },

    /** Update effect parameters */
    async setEffectParams(params: EffectParams): Promise<ApiResponse> {
        return request<ApiResponse>('/effect/params', {
            method: 'PATCH',
            body: JSON.stringify({ params }),
        });
    },

    /** Save current state as scene */
    async saveScene(name: string): Promise<ApiResponse> {
        return request<ApiResponse>('/scenes', {
            method: 'POST',
            body: JSON.stringify({ name } satisfies SaveSceneRequest),
        });
    },

    /** Apply a saved scene */
    async applyScene(id: string): Promise<ApiResponse> {
        return request<ApiResponse>('/scenes/apply', {
            method: 'POST',
            body: JSON.stringify({ id }),
        });
    },

    /** Delete a scene */
    async deleteScene(id: string): Promise<ApiResponse> {
        return request<ApiResponse>(`/scenes/${id}`, {
            method: 'DELETE',
        });
    },
};
