import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { extname } from 'path';

@Injectable()
export class FirebaseStorageService {
  private bucket: any;

  constructor(private configService: ConfigService) {
    // Verificar que Firebase Admin esté inicializado
    if (admin.apps.length === 0) {
      throw new Error('Firebase Admin SDK no está inicializado');
    }
    
    // Usar el project ID como bucket name por defecto si no está especificado
    const bucketName = this.configService.get<string>('FIREBASE_STORAGE_BUCKET') 
      || `${this.configService.get<string>('FIREBASE_PROJECT_ID')}.appspot.com`;
    
    this.bucket = admin.app().storage().bucket(bucketName);
  }

  async uploadFile(
    file: any,
    folder: string = 'uploads',
    allowedExtensions: string[] = ['.jpg', '.jpeg', '.png', '.gif', '.webp']
  ): Promise<string> {
    try {
      // Validar extensión del archivo
      const fileExtension = extname(file.filename).toLowerCase();
      if (!allowedExtensions.includes(fileExtension)) {
        throw new BadRequestException(
          `Tipo de archivo no permitido. Solo se permiten: ${allowedExtensions.join(', ')}`
        );
      }

      // Generar nombre único para el archivo
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const fileName = `${folder}/${uniqueSuffix}${fileExtension}`;

      // Crear referencia al archivo en Firebase Storage
      const fileRef = this.bucket.file(fileName);

      // Crear stream de escritura
      const stream = fileRef.createWriteStream({
        metadata: {
          contentType: file.mimetype,
          metadata: {
            originalName: file.filename,
            uploadedAt: new Date().toISOString(),
          },
        },
        public: true, // Hacer el archivo público
      });

      // Promise para manejar el upload
      return new Promise((resolve, reject) => {
        stream.on('error', (error: Error) => {
          reject(new BadRequestException(`Error subiendo archivo: ${error.message}`));
        });

        stream.on('finish', async () => {
          try {
            // Hacer el archivo público y obtener la URL
            await fileRef.makePublic();
            const publicUrl = `https://storage.googleapis.com/${this.bucket.name}/${fileName}`;
            resolve(publicUrl);
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
            reject(new BadRequestException(`Error haciendo público el archivo: ${errorMessage}`));
          }
        });

        // Escribir el archivo al stream
        file.file.pipe(stream);
      });  
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error procesando archivo: ${errorMessage}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<boolean> {
    try {
      // Extraer el nombre del archivo de la URL
      const urlParts = fileUrl.split('/');
      const fileName = urlParts[urlParts.length - 1];
      
      // Encontrar el archivo en el bucket
      const file = this.bucket.file(fileName);
      
      // Verificar si el archivo existe
      const [exists] = await file.exists();
      if (!exists) {
        return false;
      }

      // Eliminar el archivo
      await file.delete();
      return true;
    } catch (error) {
      console.error('Error eliminando archivo de Firebase Storage:', error);
      return false;
    }
  }

  async getSignedUrl(fileName: string, expiresIn: number = 3600): Promise<string> {
    try {
      const file = this.bucket.file(fileName);
      const [url] = await file.getSignedUrl({
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });
      return url;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      throw new BadRequestException(`Error generando URL firmada: ${errorMessage}`);
    }
  }
}