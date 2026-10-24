import type { CoursePart } from './types';
export const Header = ({ name }: { name: string }) => <h1>{name}</h1>;
const assertNever = (part: never): never => { throw new Error(`Unknown course part: ${JSON.stringify(part)}`); };
export const Part = ({ part }: { part: CoursePart }) => {
  const heading = <h2>{part.name} · {part.exerciseCount}</h2>;
  switch (part.kind) {
    case 'basic': return <section>{heading}<p>{part.description}</p></section>;
    case 'group': return <section>{heading}<p>Group projects: {part.groupProjectCount}</p></section>;
    case 'background': return <section>{heading}<p>{part.description}</p><a href={part.backgroundMaterial}>{part.backgroundMaterial}</a></section>;
    case 'special': return <section>{heading}<p>{part.description}</p><p>Required skills: {part.requirements.join(', ')}</p></section>;
    default: return assertNever(part);
  }
};
export const Content = ({ parts }: { parts: CoursePart[] }) => <>{parts.map(part => <Part key={part.name} part={part} />)}</>;
export const Total = ({ parts }: { parts: CoursePart[] }) => <p><strong>Number of exercises {parts.reduce((sum, part) => sum + part.exerciseCount, 0)}</strong></p>;
