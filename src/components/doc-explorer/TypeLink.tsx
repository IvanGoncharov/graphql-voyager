import './TypeLink.css';

import {
  isBuiltInScalarType,
  isInputObjectType,
  isScalarType,
} from '../../introspection';
import { highlightTerm } from '../../utils';

interface TypeLinkProps {
  type: {
    name: string;
  };
  onClick: (any) => void;
  filter?: string;
}

export default function TypeLink(props: TypeLinkProps) {
  const { type, onClick, filter } = props;

  let className;
  if (isBuiltInScalarType(type)) className = '-built-in';
  else if (isScalarType(type)) className = '-scalar';
  else if (isInputObjectType(type)) className = '-input-obj';
  else className = '-object';

  return (
    <a
      className={`type-name ${className}`}
      onClick={(event) => {
        event.stopPropagation();
        onClick(type);
      }}
    >
      {highlightTerm(type.name, filter)}
    </a>
  );
}
