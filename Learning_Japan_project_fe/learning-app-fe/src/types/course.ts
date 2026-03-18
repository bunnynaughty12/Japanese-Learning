export interface Section {
    id: string;
    title: string;
    lessonCount: number;
  }
  
  export interface Course {
    id: string;
    title: string;
    description: string;
    thumbnail: string;
    level: string;
    progress: number;
    totalLessons: number;
    completedLessons: number;
    lastAccessed?: string;
    instructor: string;
    duration?: string;
    createdAt?: string;
    sections: Section[];
    expanded?: boolean;
    currentLesson?: string;
    totalSongs?: number;
  }