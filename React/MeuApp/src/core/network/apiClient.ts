import axios from 'axios';
import { Platform } from 'react-native';

import { ApiConstants } from '@/core/constants/api';

// Na Web (desenvolvimento) as chamadas passam pelo proxy em
// src/app/api/proxy/[...path]+api.ts para contornar o CORS da API.
const baseURL = Platform.OS === 'web' && __DEV__ ? '/api/proxy' : ApiConstants.baseUrl;

export const apiClient = axios.create({
  baseURL,
  timeout: 59_000,
  headers: { 'Content-Type': 'application/json' },
});
