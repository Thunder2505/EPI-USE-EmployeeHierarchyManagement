import { useState } from 'react';

const employees = {
  id: 1,
  name: 'CEO',
  title: 'Chief Executive Officer',
  children: [
    {
      id: 2,
      name: 'CTO',
      title: 'Chief Tech Officer',
      children: [
        { id: 3, name: 'Dev 1', title: 'Developer', children: [] },
        { id: 4, name: 'Dev 2', title: 'Developer', children: [] },
      ],
    },
    {
      id: 5,
      name: 'CFO',
      title: 'Chief Financial Officer',
      children: [
        { id: 6, name: 'Accountant', title: 'Accountant', children: [] },
      ],
    },
  ],
};

const TreeNode = ({ node }) => {
  const [expanded, setExpanded] = useState(true);

  return (
    <div className="flex flex-col items-center">
      <div
        className="cursor-pointer p-2 rounded bg-blue-200 shadow hover:bg-blue-300 transition"
        onClick={() => setExpanded((e) => !e)}
      >
        <div className="font-bold">{node.name}</div>
        <div className="text-sm">{node.title}</div>
      </div>

      {node.children?.length > 0 && expanded && (
        <div className="flex mt-4 space-x-4">
          {node.children.map((child) => (
            <div key={child.id} className="flex flex-col items-center">
              <div className="h-6 border-l-2 border-gray-400"></div>
              <TreeNode node={child} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default function EmployeeTree() {
  return (
    <div className="flex flex-col items-center mt-10">
      <TreeNode node={employees} />
    </div>
  );
}
