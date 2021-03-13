import * as React from 'react';

import Inspector from './Inspector';

type Props = {
  value: any;
  small?: boolean;
};

const delimiter = '%_%';

const ValueInspector = ({ value, small }: Props) => {
  const [expandedPaths, setExpandedPaths] = React.useState<string[]>([]);

  function onToggleExpand(path: string[]) {
    const pathString = path.join(delimiter);

    if (expandedPaths.includes(pathString)) {
      setExpandedPaths(expandedPaths.filter(currentPath => currentPath !== pathString));
    } else {
      setExpandedPaths(expandedPaths.concat(pathString));
    }
  }

  return (
    <Inspector
      delimiter={delimiter}
      value={value}
      expandedPaths={expandedPaths}
      onToggleExpand={onToggleExpand}
      small={small}
    />
  );
};

export default ValueInspector;
