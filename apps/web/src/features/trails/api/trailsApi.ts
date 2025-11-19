import { client } from "@/lib/client";
import type {
  TrailListQueryParams,
  CreateTrailBody,
  UpdateTrailBody,
  AddContentBody,
  UpdateContentBody,
  ReorderContentBody,
  AddPrerequisiteBody,
} from "../types";

export const trailsApi = {
  // ===================================
  // Trail CRUD
  // ===================================

  listTrails: async (params?: TrailListQueryParams) => {
    const response = await client.admin.trails.get(
      params ? { query: params as any } : undefined,
    );
    return response.data;
  },

  getTrail: async (id: number) => {
    const response = await client.admin.trails({ id: id.toString() }).get();
    return response.data;
  },

  createTrail: async (body: CreateTrailBody) => {
    const response = await client.admin.trails.post(body as any);
    if (response.error) {
      const errorBody = response.error as any;
      
      // Extract the error message from the nested structure
      let errorMessage = "Erro ao criar trilha";
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
      
      throw new Error(errorMessage);
    }
    return response.data;
  },

  updateTrail: async (id: number, body: UpdateTrailBody) => {
    const response = await client.admin.trails({ id: id.toString() }).put(
      body as any,
    );
    if (response.error) {
      const errorBody = response.error as any;
      
      // Extract the error message from the nested structure
      let errorMessage = "Erro ao atualizar trilha";
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
      
      throw new Error(errorMessage);
    }
    return response.data;
  },

  deleteTrail: async (id: number) => {
    const response = await client.admin.trails({ id: id.toString() }).delete();
    if (response.error) {
      const errorBody = response.error as any;
      
      // Extract error message and details
      let errorMessage = "Erro ao excluir trilha";
      let dependentTrails: any[] | undefined;
      
      // Eden wraps the actual error in value.error
      if (errorBody?.value?.error) {
        const actualError = errorBody.value.error;
        if (actualError?.message) {
          errorMessage = actualError.message;
        }
        if (actualError?.details?.dependentTrails) {
          dependentTrails = actualError.details.dependentTrails;
        }
      } else if (errorBody?.value?.message) {
        errorMessage = errorBody.value.message;
        if (errorBody.value?.details?.dependentTrails) {
          dependentTrails = errorBody.value.details.dependentTrails;
        }
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
        if (errorBody?.details?.dependentTrails) {
          dependentTrails = errorBody.details.dependentTrails;
        }
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
      
      const error: any = new Error(errorMessage);
      error.dependentTrails = dependentTrails;
      throw error;
    }
    return response.data;
  },

  publishTrail: async (id: number) => {
    const response = await client.admin.trails({ id: id.toString() }).publish.patch();
    if (response.error) {
      const errorBody = response.error as any;
      
      // Extract the error message from the nested structure
      let errorMessage = "Erro ao publicar trilha";
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
      
      throw new Error(errorMessage);
    }
    return response.data;
  },

  archiveTrail: async (id: number) => {
    const response = await client.admin.trails({ id: id.toString() }).archive.patch();
    if (response.error) {
      const errorBody = response.error as any;
      
      // Extract the error message from the nested structure
      let errorMessage = "Erro ao arquivar trilha";
      if (errorBody?.error?.message) {
        errorMessage = errorBody.error.message;
      } else if (errorBody?.message) {
        errorMessage = errorBody.message;
      } else if (typeof errorBody === 'string') {
        errorMessage = errorBody;
      }
      
      throw new Error(errorMessage);
    }
    return response.data;
  },

  // ===================================
  // Content Management
  // ===================================

  addContent: async (trailId: number, body: AddContentBody) => {
    const response = await client.admin.trails({ id: trailId.toString() }).content.post(
      body as any,
    );
    return response.data;
  },

  updateContent: async (
    trailId: number,
    contentId: number,
    body: UpdateContentBody,
  ) => {
    const response = await client.admin.trails({ id: trailId.toString() }).content({
      contentId: contentId.toString(),
    }).put(body as any);
    return response.data;
  },

  removeContent: async (trailId: number, contentId: number) => {
    const response = await client.admin.trails({ id: trailId.toString() }).content({
      contentId: contentId.toString(),
    }).delete();
    return response.data;
  },

  reorderContent: async (trailId: number, body: ReorderContentBody) => {
    const response = await client.admin.trails({
      id: trailId.toString(),
    }).content.reorder.post(body as any);
    return response.data;
  },

  // ===================================
  // Prerequisites Management
  // ===================================

  addPrerequisite: async (trailId: number, body: AddPrerequisiteBody) => {
    const response = await client.admin.trails({
      id: trailId.toString(),
    }).prerequisites.post(body as any);
    return response.data;
  },

  removePrerequisite: async (trailId: number, prerequisiteId: number) => {
    const response = await client.admin.trails({
      id: trailId.toString(),
    }).prerequisites({ prerequisiteId: prerequisiteId.toString() }).delete();
    return response.data;
  },
};
