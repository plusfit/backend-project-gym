import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app/app.module';
import { EXERCISE_REPOSITORY } from '../src/context/exercises/repositories/exercise.repository';
import { MediaType } from '../src/context/exercises/dto/create-exercise.dto';
import { Model } from 'mongoose';
import { Exercise } from '../src/context/exercises/schemas/exercise.schema';
import { getModelToken } from '@nestjs/mongoose';

async function detectMediaType(url: string): Promise<MediaType> {
  if (!url) return MediaType.IMAGE; // default
  
  const videoExtensions = ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v', '.3gp', '.mkv'];
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp', '.svg', '.ico', '.tiff'];
  
  const lowercaseUrl = url.toLowerCase();
  
  if (videoExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return MediaType.VIDEO;
  }
  
  if (imageExtensions.some(ext => lowercaseUrl.includes(ext))) {
    return MediaType.IMAGE;
  }
  
  // Si no se puede determinar por extensión, revisar parámetros de URL o headers comunes
  if (lowercaseUrl.includes('video') || lowercaseUrl.includes('mp4') || lowercaseUrl.includes('stream')) {
    return MediaType.VIDEO;
  }
  
  return MediaType.IMAGE; // default
}

async function updateExercisesMediaType() {
  const app = await NestFactory.createApplicationContext(AppModule);
  
  try {
    // Usar directamente el modelo de Mongoose
    const exerciseModel: Model<Exercise> = app.get(getModelToken(Exercise.name));
    
    // Obtener todos los ejercicios que no tienen mediaType
    const exercises = await exerciseModel.find({
      $or: [
        { mediaType: { $exists: false } },
        { mediaType: null }
      ]
    }).exec();
    
    console.log(`Found ${exercises.length} exercises without mediaType`);
    
    let updated = 0;
    
    for (const exercise of exercises) {
      if (exercise.gifUrl) {
        const mediaType = await detectMediaType(exercise.gifUrl);
        await exerciseModel.findByIdAndUpdate(
          exercise._id,
          { mediaType },
          { new: true }
        ).exec();
        
        console.log(`Updated exercise "${exercise.name}" with mediaType: ${mediaType}`);
        updated++;
      }
    }
    
    console.log(`Successfully updated ${updated} exercises`);
    
  } catch (error) {
    console.error('Error updating exercises:', error);
  } finally {
    await app.close();
  }
}

// Ejecutar el script
updateExercisesMediaType().catch(console.error);
