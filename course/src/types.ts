interface CoursePartBase { name: string; exerciseCount: number }
interface CoursePartDescription extends CoursePartBase { description: string }
interface CoursePartBasic extends CoursePartDescription { kind: 'basic' }
interface CoursePartGroup extends CoursePartBase { kind: 'group'; groupProjectCount: number }
interface CoursePartBackground extends CoursePartDescription { kind: 'background'; backgroundMaterial: string }
interface CoursePartSpecial extends CoursePartDescription { kind: 'special'; requirements: string[] }
export type CoursePart = CoursePartBasic | CoursePartGroup | CoursePartBackground | CoursePartSpecial;
