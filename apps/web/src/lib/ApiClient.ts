/**
 * A comprehensive API client built with Axios in TypeScript
 * Includes methods for common operations including file uploads
 */
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, CancelTokenSource } from 'axios';

interface ApiClientOptions {
  headers?: Record<string, string>;
  timeout?: number;
  withCredentials?: boolean;
}

interface CancelTokenObject {
  token: any;
  cancel: (message?: string) => void;
}

class ApiClient {
  private client: AxiosInstance;

  /**
   * Creates a new API client instance
   * @param baseURL - The base URL for the API
   * @param options - Additional configuration options
   */
  constructor(baseURL: string, options: ApiClientOptions = {}) {
    const { headers = {}, timeout = 30000, withCredentials = false } = options;

    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      withCredentials,
    });

    // Add request interceptor for authentication tokens, etc.
    this.client.interceptors.request.use(
      (config) => {
        // You can modify request config here (add auth tokens, etc.)
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Add response interceptors for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        // Handle specific error codes or implement retry logic
        if (error.response) {
          // Server responded with a status code outside of 2xx range
          console.error('Response error:', error.response.status, error.response.data);
        } else if (error.request) {
          // Request was made but no response received
          console.error('Request error:', error.request);
        } else {
          // Something happened in setting up the request
          console.error('Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set an authentication token for future requests
   * @param token - The authentication token
   * @param scheme - The authentication scheme (e.g., 'Bearer')
   */
  public setAuthToken(token: string, scheme: string = 'Bearer'): void {
    this.client.defaults.headers.common['Authorization'] = `${scheme} ${token}`;
  }

  /**
   * Remove authentication token
   */
  public clearAuthToken(): void {
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Perform a GET request
   * @param url - The endpoint URL
   * @param params - URL parameters
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async get<T = any>(
    url: string, 
    params: Record<string, any> = {}, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.get(url, { ...config, params });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform a POST request
   * @param url - The endpoint URL
   * @param data - Request payload
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async post<T = any, D = any>(
    url: string, 
    data?: D, 
    config: AxiosRequestConfig = {}
  ): Promise<AxiosResponse<T>> {
    try {
      const response: AxiosResponse<T> = await this.client.post(url, data, config);
      return response
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform a PUT request
   * @param url - The endpoint URL
   * @param data - Request payload
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async put<T = any, D = any>(
    url: string, 
    data?: D, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.put(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform a PATCH request
   * @param url - The endpoint URL
   * @param data - Request payload
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async patch<T = any, D = any>(
    url: string, 
    data?: D, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.patch(url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Perform a DELETE request
   * @param url - The endpoint URL
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async delete<T = any>(
    url: string, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const response: AxiosResponse<T> = await this.client.delete(url, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload a single file
   * @param url - The endpoint URL
   * @param file - The file to upload
   * @param fieldName - The field name for the file
   * @param additionalData - Additional form data
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async uploadFile<T = any>(
    url: string, 
    file: File | Blob, 
    fieldName: string = 'file', 
    additionalData: Record<string, any> = {}, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const formData = new FormData();
      formData.append(fieldName, file);
      
      // Add any additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response: AxiosResponse<T> = await this.client.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Upload multiple files
   * @param url - The endpoint URL
   * @param files - Array of files to upload
   * @param fieldName - The field name for the files
   * @param additionalData - Additional form data
   * @param config - Additional Axios config
   * @returns The response data
   */
  public async uploadMultipleFiles<T = any>(
    url: string, 
    files: Array<File | Blob>, 
    fieldName: string = 'files', 
    additionalData: Record<string, any> = {}, 
    config: AxiosRequestConfig = {}
  ): Promise<T> {
    try {
      const formData = new FormData();
      
      // Append each file to form data
      files.forEach((file, index) => {
        formData.append(`${fieldName}[${index}]`, file);
      });
      
      // Add any additional form data
      Object.entries(additionalData).forEach(([key, value]) => {
        formData.append(key, String(value));
      });

      const response: AxiosResponse<T> = await this.client.post(url, formData, {
        ...config,
        headers: {
          ...config.headers,
          'Content-Type': 'multipart/form-data',
        },
        // Track upload progress if needed
        onUploadProgress: config.onUploadProgress,
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Download a file
   * @param url - The endpoint URL
   * @param params - URL parameters
   * @param config - Additional Axios config
   * @returns The file as a Blob
   */
  public async downloadFile(
    url: string, 
    params: Record<string, any> = {}, 
    config: AxiosRequestConfig = {}
  ): Promise<Blob> {
    try {
      const response: AxiosResponse<Blob> = await this.client.get(url, {
        ...config,
        params,
        responseType: 'blob',
      });
      
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get a cancel token to abort requests
   * @returns An object with a cancel token and cancel method
   */
  public getCancelToken(): CancelTokenObject {
    const source: CancelTokenSource = axios.CancelToken.source();
    
    return {
      token: source.token,
      cancel: source.cancel,
    };
  }
}

export default ApiClient;