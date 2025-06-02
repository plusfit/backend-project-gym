import { Inject, Injectable } from "@nestjs/common";

import { CreateExerciseDto, MediaType } from "@/src/context/exercises/dto/create-exercise.dto";
import { UpdateExerciseDto } from "@/src/context/exercises/dto/update-exercise.dto";
import { EXERCISE_REPOSITORY } from "@/src/context/exercises/repositories/exercise.repository";

@Injectable()
export class ExercisesService {
  constructor(
    @Inject(EXERCISE_REPOSITORY)
    private readonly exerciseRepository: any,
  ) {}

  private detectMediaType(url: string): MediaType {
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

  async create(createExcerciseDto: CreateExerciseDto) {
    // Detectar automáticamente el mediaType si no se proporciona
    if (!createExcerciseDto.mediaType && createExcerciseDto.gifUrl) {
      createExcerciseDto.mediaType = this.detectMediaType(createExcerciseDto.gifUrl);
    }
    
    return await this.exerciseRepository.createExercise(createExcerciseDto);
  }

  async getExercises(
    page: number,
    limit: number,
    name?: string,
    type?: string,
    category?: string,
  ) {
    const offset = (page - 1) * limit;
    const filters: any = { $or: [] };

    if (name) {
      filters.$or.push({ name: { $regex: name, $options: "i" } });
    }

    if (type) {
      filters.$or.push({ type: type });
    }

    if (category) {
      filters.$or.push({ category: { $regex: category, $options: "i" } });
    }

    if (filters.$or.length === 0) {
      delete filters.$or;
    }

    const [data, total] = await Promise.all([
      this.exerciseRepository.getExercises(offset, limit, filters),
      this.exerciseRepository.countExercises(filters),
    ]);

    return {
      data,
      total,
      page,
      limit,
    };
  }

  async findOne(id: string) {
    try {
      const exercise = await this.exerciseRepository.findOne(id);
      if (exercise) {
        return exercise;
      }
      throw "Exercise not found";
    } catch (error: any) {
      return {
        success: false,
        message: `Exercise cannot be found: ${error.message}`,
      };
    }
  }

  async update(id: string, updateExcerciseDto: UpdateExerciseDto) {
    try {
      const _updateExcerciseDto = { ...updateExcerciseDto };
      _updateExcerciseDto.updatedAt = new Date();
      
      // Detectar automáticamente el mediaType si se actualiza la gifUrl y no se proporciona mediaType
      if (!_updateExcerciseDto.mediaType && _updateExcerciseDto.gifUrl) {
        _updateExcerciseDto.mediaType = this.detectMediaType(_updateExcerciseDto.gifUrl);
      }
      
      const exercise = await this.exerciseRepository.update(
        id,
        _updateExcerciseDto,
      );
      if (exercise) {
        return {
          exercise,
        };
      }
    } catch (error: any) {
      return {
        success: false,
        message: `Exercise cannot be updated: ${error.message}`,
      };
    }
  }

  async remove(id: string): Promise<string> {
    // TODO: Delete the exercise from the subroutines
    try {
      const wasRemoved = await this.exerciseRepository.remove(id);

      if (wasRemoved) {
        return "Exerscise removed successfully";
      }
      throw new Error("Exercise not found");
    } catch (error: any) {
      throw new Error(`Error when trying to delete exercise: ${error.message}`);
    }
  }
}
