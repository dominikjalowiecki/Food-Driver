import { GetMe200Response } from '../../../shared/api';

export type UserData = Omit<GetMe200Response, 'idUser' | 'created' | 'role'>;
