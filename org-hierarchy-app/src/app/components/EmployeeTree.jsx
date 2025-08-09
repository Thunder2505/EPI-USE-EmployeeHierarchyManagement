'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import styles from './EmployeeTree.module.css';

async function sha256(str) {
  const buf = await crypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(str.trim().toLowerCase())
  );
  return Array.from(new Uint8Array(buf))
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

async function getGravatarUrl(email, size = 80, defaultImage = 'identicon') {
  if (!email) return '/images/default-avatar.png';
  const hash = await sha256(email);
  return `https://0.gravatar.com/avatar/${hash}?s=${size}&d=${encodeURIComponent(defaultImage)}`;
}

export default function EmployeeTree() {
  const canvasRef = useRef(null);
  const [treeData, setTreeData] = useState(null);
  const gravatarsRef = useRef({});
  const [employeeData, setEmployeeData] = useState({});
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [lastMouse, setLastMouse] = useState({ x: 0, y: 0 });
  const [hoveredNode, setHoveredNode] = useState(null);
  const [expandedNodes, setExpandedNodes] = useState(new Set());
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const [isDraggingNode, setIsDraggingNode] = useState(false);
  const [draggedNode, setDraggedNode] = useState(null);
  const [dropTarget, setDropTarget] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  const [unassignedEmployees, setUnassignedEmployees] = useState([]);
  const [showUnassignedDropdown, setShowUnassignedDropdown] = useState(false);
  const [draggingUnassigned, setDraggingUnassigned] = useState(null);

  const [isOverTrash, setIsOverTrash] = useState(false);

  // Memoize colors to prevent re-creation on every render
  const colors = useMemo(() => ({
    dark: {
      nodeBg: '#434d8aff',
      nodeHover: '#4c5d8bff',
      borderColor: '#ffffffff',
      dragNodeBg: '#22c55e',
      dropTargetBg: '#f59e0b',
      textColor: '#ffffff',
      shadowColor: 'rgba(0, 0, 0, 0.15)'
    },
    light: {
      nodeBg: '#e2e8f0',
      nodeHover: '#cbd5e1',
      borderColor: '#1e293b',
      dragNodeBg: '#16a34a',
      dropTargetBg: '#d97706',
      textColor: '#1e293b',
      shadowColor: 'rgba(0, 0, 0, 0.1)'
    }
  }), []);

  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(
        window.matchMedia && 
        window.matchMedia('(prefers-color-scheme: dark)').matches
      );
    };
    checkDarkMode();
    
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', checkDarkMode);
    
    return () => {
      mediaQuery.removeEventListener('change', checkDarkMode);
    };
  }, []);

  // Memoize handleWheel function
  const handleWheel = useCallback((e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    const contentMouseX = (mouseX - position.x) / scale;
    const contentMouseY = (mouseY - position.y) / scale;

    const zoomSpeed = 0.001;
    const delta = -e.deltaY * zoomSpeed;
    const newScale = Math.min(Math.max(scale + delta, 0.10), 3);

    const newX = mouseX - contentMouseX * newScale;
    const newY = mouseY - contentMouseY * newScale;

    setScale(newScale);
    setPosition({ x: newX, y: newY });
  }, [scale, position]);

  // Add wheel event listener to prevent page scrolling
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const preventPageScroll = (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      handleWheel(e);
    };

    canvas.addEventListener('wheel', preventPageScroll, { passive: false });
    
    return () => {
      canvas.removeEventListener('wheel', preventPageScroll);
    };
  }, [handleWheel]);

  useEffect(() => {
    async function fetchUnassignedEmployees() {
      try {
        const response = await fetch('/api/not_assigned');
        const data = await response.json();
        setUnassignedEmployees(data);
      } catch (err) {
        console.error('Error fetching unassigned employees:', err);
      }
    }
    
    fetchUnassignedEmployees();
  }, []);

  const handleUnassignedDragStart = (employee) => {
    setDraggingUnassigned(employee);
    setIsDraggingNode(true);
    setDraggedNode({
      employee_number: employee.employee_number,
      name: `${employee.name} ${employee.surname}`,
      title: employee.role_name || 'Unknown Role',
      data: employee,
      children: [],
      width: 350,
      height: 400
    });
    setShowUnassignedDropdown(false);
  };

  const findNode = (tree, term) => {
    if (!tree) return null;
    
    term = term.toLowerCase();
    
    if (tree.employee_number.toLowerCase().includes(term) ||
        tree.name.toLowerCase().includes(term)) {
      return tree;
    }
    
    if (tree.children) {
      for (const child of tree.children) {
        const found = findNode(child, term);
        if (found) return found;
      }
    }
    
    return null;
  };

  const ExpandParents = async (node) => {
    if (!node || !canvasRef.current || !treeData) return;

    const expandParents = (nodeId, tree) => {
      const findParent = (currentNode) => {
        if (currentNode.children) {
          for (const child of currentNode.children) {
            if (child.employee_number === nodeId) {
              return currentNode;
            }
            const found = findParent(child);
            if (found) return found;
          }
        }
        return null;
      };

      const parent = findParent(tree);
      if (parent) {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          newSet.add(parent.employee_number);
          return newSet;
        });
        expandParents(parent.employee_number, tree);
      }
    };

    expandParents(node.employee_number, treeData);
  };

  const handleRemoveFromHierarchy = async (employeeId) => {
    try {
      setIsUpdating(true);
      
      // Find the current manager of the employee
      const currentManager = findCurrentManager(employeeId, treeData);
      
      if (currentManager) {
        await fetch('/api/hierarchy', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            manager_id: currentManager
          })
        });
        
        // Refresh the tree data
        await refreshTreeData();
      }
    } catch (error) {
      console.error('Error removing from hierarchy:', error);
      alert(`Failed to remove from hierarchy: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  const [foundNode, setFoundNode] = useState(null);

  // Update hierarchy in database
  const updateHierarchy = async (employeeId, newManagerId, oldManagerId) => {
    try {
      setIsUpdating(true);
      
      // First, remove the old relationship if it exists
      if (oldManagerId) {
        await fetch('/api/hierarchy', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            manager_id: oldManagerId
          })
        });
      }
      
      // Then add the new relationship
      if (newManagerId && newManagerId !== 'root') {
        const response = await fetch('/api/hierarchy', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            employee_id: employeeId,
            manager_id: newManagerId
          })
        });
        
        if (!response.ok) {
          const errorData = await response.json();
          if (errorData.error && errorData.error.includes('circular')) {
            alert('Cannot set manager to a subordinate or self.');
            return;
          }
          throw new Error(errorData.error || 'Failed to update hierarchy');
        }
      }
      
      // Refresh the tree data
      await refreshTreeData();
      
    } catch (error) {
      console.error('Error updating hierarchy:', error);
      alert(`Failed to update hierarchy: ${error.message}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Function to refresh tree data after hierarchy changes
  const refreshTreeData = async () => {
    try {
      const [hierarchyRes, employeeMap] = await Promise.all([
        fetch('/api/hierarchy'),
        Promise.resolve(employeeData) // Use existing employee data
      ]);
      
      const hierarchyData = await hierarchyRes.json();
      const tree = buildTree(hierarchyData, employeeMap);
      setTreeData(tree);
      
    } catch (err) {
      console.error('Error refreshing tree data:', err);
    }
  };

  // Find the current manager of a node
  const findCurrentManager = (nodeId, tree) => {
    const findParent = (currentNode) => {
      if (currentNode.children) {
        for (const child of currentNode.children) {
          if (child.employee_number === nodeId) {
            return currentNode.employee_number === 'root' ? null : currentNode.employee_number;
          }
          const found = findParent(child);
          if (found !== undefined) return found;
        }
      }
      return undefined;
    };

    return findParent(tree);
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || !treeData) return;
    
    const node = findNode(treeData, searchTerm.trim());
    if (node) {
      setFoundNode(node);
      await ExpandParents(node);
    } else {
      alert('No employee found matching your search');
      setFoundNode(null);
    }
  };

  const centerFoundNode = () => {
    if (!foundNode || !canvasRef.current) return;
    
    const { nodes } = calculatePositions(treeData);
    const nodeToCenter = nodes.find(n => n.employee_number === foundNode.employee_number);
    
    if (nodeToCenter) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      const targetScale = Math.min(
        1.5,
        Math.max(
          0.5,
          Math.min(
            rect.width / (nodeToCenter.width * 1.5),
            rect.height / (nodeToCenter.height * 2)
          )
        )
      );
      
      const centerX = rect.width / 2 - nodeToCenter.x * targetScale;
      const centerY = rect.height / 3 - nodeToCenter.y * targetScale;
      
      setScale(targetScale);
      setPosition({ x: centerX, y: centerY });
      setHoveredNode(foundNode.employee_number);
      setTimeout(() => setHoveredNode(null), 2000);
    }
  };

  const fetchEmployeeData = async () => {
    try {
      const [employeesRes, rolesRes, branchesRes, departmentsRes, usersRes] = await Promise.all([
        fetch('/api/employees'),
        fetch('/api/roles'),
        fetch('/api/branches'),
        fetch('/api/departments'),
        fetch('/api/users')
      ]);

      const employees = await employeesRes.json();
      const roles = await rolesRes.json();
      const branches = await branchesRes.json();
      const departments = await departmentsRes.json();
      const users = await usersRes.json();

      const roleMap = {};
      roles.forEach(role => {
        roleMap[role.role_id] = role.name || `Role ${role.role_id}`;
      });

      const branchMap = {};
      branches.forEach(branch => {
        branchMap[branch.branch_id] = branch.name || `Branch ${branch.branch_number}`;
      });

      const departmentMap = {};
      departments.forEach(dept => {
        departmentMap[dept.dept_id] = dept.name || `Dept ${dept.dept_number}`;
      });

      const userMap = {};
      users.forEach(user => {
        userMap[user.employee_number] = user.email || '';
      });

      const employeeMap = {};
      
      await Promise.all(
        employees.map(async (emp) => {
          const email = userMap[emp.employee_number] || '';
          const gravatarUrl = await getGravatarUrl(email);

          const img = new Image();
          img.src = gravatarUrl;
          gravatarsRef.current[emp.employee_number] = img;

          employeeMap[emp.employee_number] = {
            ...emp,
            role_name: roleMap[emp.role_number] || 'Unknown Role',
            branch_name: branchMap[emp.branch_number] || 'Unknown Branch',
            dept_name: departmentMap[emp.dept_number] || 'Unknown Department',
            email: email || 'No email',
            gravatarUrl,
          };
        })
      );

      setEmployeeData(employeeMap);
      return employeeMap;
    } catch (err) {
      console.error('Error fetching employee data:', err);
      return {};
    }
  };

  function buildTree(hierarchyData, employeeMap) {
    if (!hierarchyData || hierarchyData.length === 0) return null;

    const nodes = {};
    const subordinates = new Set();

    hierarchyData.forEach(({ manager_id: managerId, employee_id: subordinateId }) => {
      if (!nodes[managerId]) {
        const empData = employeeMap[managerId] || {};
        nodes[managerId] = {
          employee_number: managerId,
          name: empData.name ? `${empData.name} ${empData.surname}` : `Employee ${managerId}`,
          title: empData.role_name || 'Unknown Role',
          data: empData,
          children: [],
        };
      }
      if (!nodes[subordinateId]) {
        const empData = employeeMap[subordinateId] || {};
        nodes[subordinateId] = {
          employee_number: subordinateId,
          name: empData.name ? `${empData.name} ${empData.surname}` : `Employee ${subordinateId}`,
          title: empData.role_name || 'Unknown Role',
          data: empData,
          children: [],
        };
      }
      nodes[managerId].children.push(nodes[subordinateId]);
      subordinates.add(subordinateId);
    });

    const roots = Object.keys(nodes)
      .filter(empId => !subordinates.has(empId))
      .map(empId => nodes[empId]);

    if (roots.length === 1) {
      return roots[0];
    } else if (roots.length > 1) {
      return {
        employee_number: 'root',
        name: 'Organization',
        title: 'Root Level',
        data: {},
        children: roots,
      };
    } else {
      return null;
    }
  }

  useEffect(() => {
    async function fetchHierarchy() {
      try {
        const [hierarchyRes, employeeMap] = await Promise.all([
          fetch('/api/hierarchy'),
          fetchEmployeeData()
        ]);
        
        const hierarchyData = await hierarchyRes.json();
        const tree = buildTree(hierarchyData, employeeMap);
        setTreeData(tree);
        
        const allNodes = new Set();
        const collectNodes = (node) => {
          if (node) {
            allNodes.add(node.employee_number);
            if (node.children) {
              node.children.forEach(collectNodes);
            }
          }
        };
        collectNodes(tree);
        setExpandedNodes(allNodes);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setTreeData(null);
      }
    }
    fetchHierarchy();
  }, []);

  // Memoize calculatePositions function to prevent recreation
  const calculatePositions = useCallback((tree) => {
    if (!tree) return { nodes: [], connections: [] };

    const nodes = [];
    const connections = [];
    const nodeWidth = 350;
    const nodeHeight = 400;
    const levelHeight = 750;

    const calculateSubtreeWidth = (node) => {
      if (!node.children || node.children.length === 0 || !expandedNodes.has(node.employee_number)) {
        return nodeWidth;
      }
      
      const childrenWidth = node.children.reduce((total, child) => {
        return total + calculateSubtreeWidth(child);
      }, 0);
      
      const spacing = Math.max(0, (node.children.length - 1) * 20);
      return Math.max(nodeWidth, childrenWidth + spacing);
    };

    const positionNodes = (node, x, y, level = 0) => {
      const nodeId = node.employee_number;
      
      nodes.push({
        ...node,
        x: x,
        y: y,
        level: level,
        width: nodeWidth,
        height: nodeHeight,
        expanded: expandedNodes.has(nodeId),
        hasChildren: node.children && node.children.length > 0
      });

      if (node.children && node.children.length > 0 && expandedNodes.has(nodeId)) {
        const childY = y + levelHeight;
        
        const totalChildrenWidth = node.children.reduce((total, child) => {
          return total + calculateSubtreeWidth(child);
        }, 0);
        
        const spacing = Math.max(10, (totalChildrenWidth - node.children.length * nodeWidth) / Math.max(1, node.children.length - 1));
        let currentX = x - totalChildrenWidth / 2 + nodeWidth / 2;

        node.children.forEach((child, index) => {
          const childWidth = calculateSubtreeWidth(child);
          const childCenterX = currentX + childWidth / 2 - nodeWidth / 2;
          
          connections.push({
            parentX: x,
            parentY: y,
            childX: childCenterX,
            childY: childY,
            parentId: nodeId,
            childId: child.employee_number
          });

          positionNodes(child, childCenterX, childY, level + 1);
          currentX += childWidth + spacing;
        });
      }
    };

    positionNodes(tree, 0, 0);
    return { nodes, connections };
  }, [expandedNodes]);

  useEffect(() => {
    if (treeData && canvasRef.current) {
      setTimeout(() => {
        const canvas = canvasRef.current;
        const rect = canvas.getBoundingClientRect();
        const centerX = rect.width / 2;
        const centerY = 100;
        
        setPosition({ x: centerX, y: centerY });
      }, 100);
    }
  }, [treeData, expandedNodes]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !treeData) return;

    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    
    ctx.save();
    ctx.translate(position.x, position.y);
    ctx.scale(scale, scale);

    const color = isDarkMode ? colors.dark : colors.light; 

    ctx.clearRect(-position.x/scale, -position.y/scale, rect.width/scale, rect.height/scale);

    const { nodes, connections } = calculatePositions(treeData);

    // Draw connections
    ctx.strokeStyle = color.borderColor;
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    
    connections.forEach(conn => {
      const startX = conn.parentX;
      const startY = conn.parentY + 50;
      const endX = conn.childX;
      const endY = conn.childY - 50;
      
      ctx.beginPath();
      ctx.moveTo(startX, startY);
      
      ctx.bezierCurveTo(
        startX, startY + 60,
        endX, endY - 60,
        endX, endY
      );
      
      ctx.stroke();
    });

    // Draw nodes
    nodes.forEach(node => {
      // Skip drawing the dragged node at its original position
      if (draggedNode && node.employee_number === draggedNode.employee_number) {
        return;
      }

      const isHovered = hoveredNode === node.employee_number;
      const isDropTarget = dropTarget === node.employee_number;
      const nodeX = node.x - node.width / 2;
      const nodeY = node.y - node.height / 2;

      // Node background
      const gradient = ctx.createLinearGradient(nodeX, nodeY, nodeX, nodeY + node.height);
      if (isDropTarget) {
        gradient.addColorStop(0, color.dropTargetBg);
        gradient.addColorStop(1, isDarkMode ? '#d97706' : '#b45309');
      } else if (isHovered) {
        gradient.addColorStop(0, color.nodeHover);
        gradient.addColorStop(1, isDarkMode ? '#1e40af' : '#93c5fd');
      } else {
        gradient.addColorStop(0, color.nodeBg);
        gradient.addColorStop(1, color.nodeHover);
      }
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = color.shadowColor;
      ctx.shadowBlur = isHovered || isDropTarget ? 8 : 4;
      ctx.shadowOffsetY = isHovered || isDropTarget ? 4 : 2;
      
      const radius = 8;
      ctx.beginPath();
      ctx.roundRect(nodeX, nodeY, node.width, node.height, radius);
      ctx.fill();
      
      if (isDropTarget) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      const imgSize = 200;
      const imgY = node.y - node.height / 2 + 60; 

      const gravatarImg = gravatarsRef.current[node.employee_number];
      if (gravatarImg && gravatarImg.complete && gravatarImg.naturalWidth !== 0) {
        const imgX = node.x - imgSize / 2;
        ctx.drawImage(gravatarImg, imgX, imgY, imgSize, imgSize);
      }

      ctx.fillStyle = color.textColor;
      ctx.textAlign = 'center';

      ctx.font = '400 24px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.globalAlpha = 0.8;
      ctx.fillText(node.employee_number, node.x, imgY - 10);
      ctx.globalAlpha = 1;

      ctx.font = '600 30px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      const displayName = node.name.length > 20 ? node.name.substring(0, 17) + '...' : node.name;
      ctx.fillText(displayName, node.x, imgY + imgSize + 30);

      ctx.font = '400 20px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif';
      ctx.globalAlpha = 0.9;
      ctx.fillText(node.title, node.x, imgY + imgSize + 55);
      ctx.globalAlpha = 1;

      if (node.hasChildren) {
        const indicatorX = nodeX + node.width - 25;
        const indicatorY = nodeY + node.height - 15;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.font = '16px monospace';
        ctx.textAlign = 'center';
        ctx.fillText(node.expanded ? '▾' : '▸', indicatorX, indicatorY);
      }
    });

    ctx.restore();

    if (draggedNode && isDraggingNode) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      
      ctx.save();
      ctx.globalAlpha = 0.8;
      
      // Calculate mouse position in canvas coordinates
      const mouseCanvasX = lastMouse.x - rect.left;
      const mouseCanvasY = lastMouse.y - rect.top;
      
      // Reduced dimensions for the dragged node
      const scaleFactor = 0.2; 
      const nodeWidth = draggedNode.width * scaleFactor;
      const nodeHeight = draggedNode.height * scaleFactor;
      
      const nodeX = mouseCanvasX - dragOffset.x * scaleFactor - nodeWidth / 2;
      const nodeY = mouseCanvasY - dragOffset.y * scaleFactor - nodeHeight / 2;

      // Draw dragged node with green background
      const gradient = ctx.createLinearGradient(nodeX, nodeY, nodeX, nodeY + nodeHeight);
      gradient.addColorStop(0, color.dragNodeBg);
      gradient.addColorStop(1, isDarkMode ? '#16a34a' : '#15803d');
      
      ctx.fillStyle = gradient;
      ctx.shadowColor = color.nodeShadow;
      ctx.shadowBlur = 8 * scaleFactor; // Scale shadow too
      ctx.shadowOffsetY = 5 * scaleFactor;
      
      const radius = 8 * scaleFactor;
      ctx.beginPath();
      ctx.roundRect(nodeX, nodeY, nodeWidth, nodeHeight, radius);
      ctx.fill();
      
      ctx.shadowColor = 'transparent';
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;

      // Smaller image
      const imgSize = 200 * scaleFactor;
      const imgY = nodeY + nodeHeight / 2 - imgSize / 2 - 30 * scaleFactor;

      const gravatarImg = gravatarsRef.current[draggedNode.employee_number];
      if (gravatarImg && gravatarImg.complete && gravatarImg.naturalWidth !== 0) {
        const imgX = nodeX + nodeWidth / 2 - imgSize / 2;
        ctx.drawImage(gravatarImg, imgX, imgY, imgSize, imgSize);
      }

      ctx.fillStyle = color.textColor;
      ctx.textAlign = 'center';
      
      const centerX = nodeX + nodeWidth / 2;

      // Scaled down text
      ctx.font = `400 ${24 * scaleFactor}px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`;
      ctx.globalAlpha = 0.6;
      ctx.fillText(draggedNode.employee_number, centerX, imgY - 10 * scaleFactor);
      ctx.globalAlpha = 0.8;

      ctx.font = `600 ${30 * scaleFactor}px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`;
      const displayName = draggedNode.name.length > 20 ? 
        draggedNode.name.substring(0, 17) + '...' : draggedNode.name;
      ctx.fillText(displayName, centerX, imgY + imgSize + 20 * scaleFactor);

      ctx.font = `400 ${20 * scaleFactor}px "Segoe UI", Tahoma, Geneva, Verdana, sans-serif`;
      ctx.globalAlpha = 0.7;
      ctx.fillText(draggedNode.title, centerX, imgY + imgSize + 40 * scaleFactor);
      
      ctx.restore();
    }

  }, [treeData, expandedNodes, scale, position, hoveredNode, draggedNode, isDraggingNode, dropTarget, lastMouse, dragOffset, isDarkMode, calculatePositions, colors.dark, colors.light]);

  const getNodeAtPosition = (mouseX, mouseY) => {
    const { nodes } = calculatePositions(treeData);
    return nodes.find(node => {
      const nodeX = node.x - node.width / 2;
      const nodeY = node.y - node.height / 2;
      return mouseX >= nodeX && mouseX <= nodeX + node.width &&
             mouseY >= nodeY && mouseY <= nodeY + node.height;
    });
  };

  const handleMouseMove = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    setLastMouse({ x: e.clientX, y: e.clientY });

    if (isDraggingNode && draggedNode) {
      // Update drop target detection
      const mouseX = (e.clientX - rect.left - position.x) / scale;
      const mouseY = (e.clientY - rect.top - position.y) / scale;
      
      const targetNode = getNodeAtPosition(mouseX, mouseY);
      
      if (targetNode && 
          targetNode.employee_number !== draggedNode.employee_number &&
          targetNode.employee_number !== 'root') {
        setDropTarget(targetNode.employee_number);
      } else {
        setDropTarget(null);
      }
      return;
    }

    if (isDragging && !isDraggingNode) {
      const deltaX = e.clientX - lastMouse.x;
      const deltaY = e.clientY - lastMouse.y;
      setPosition(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }));
      return;
    }

    // Regular hover detection
    const mouseX = (e.clientX - rect.left - position.x) / scale;
    const mouseY = (e.clientY - rect.top - position.y) / scale;
    
    const hoveredNodeData = getNodeAtPosition(mouseX, mouseY);
    setHoveredNode(hoveredNodeData ? hoveredNodeData.employee_number : null);
    
    if (hoveredNodeData) {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'default';
    }
  };

  const handleMouseDown = (e) => {
    if (isUpdating) return; // Prevent interactions while updating

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - position.x) / scale;
    const mouseY = (e.clientY - rect.top - position.y) / scale;

    const clickedNode = getNodeAtPosition(mouseX, mouseY);

    if (clickedNode && clickedNode.employee_number !== 'root') {
      // Start node drag
      setIsDraggingNode(true);
      setDraggedNode(clickedNode);
      
      // Calculate offset from mouse to node center
      const nodeCenterX = clickedNode.x;
      const nodeCenterY = clickedNode.y;
      const mouseCanvasX = e.clientX - rect.left;
      const mouseCanvasY = e.clientY - rect.top;
      
      setDragOffset({
        x: (mouseCanvasX - position.x) / scale - nodeCenterX,
        y: (mouseCanvasY - position.y) / scale - nodeCenterY
      });
      
      canvas.style.cursor = 'grabbing';
    } else {
      // Start canvas drag
      setIsDragging(true);
      canvas.style.cursor = 'grabbing';
    }

    setLastMouse({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = async (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (isDraggingNode) {
      if (draggedNode && dropTarget) {
        // Execute the hierarchy change
        await updateHierarchy(
          draggedNode.employee_number, 
          dropTarget, 
          findCurrentManager(draggedNode.employee_number, treeData)
        );
      } else if (draggingUnassigned && dropTarget) {
        // Handle assigning an unassigned employee
        await updateHierarchy(
          draggingUnassigned.employee_number,
          dropTarget,
          null
        );
      } else if ((draggedNode || draggingUnassigned) && isOverTrash) {
        // Handle removing from hierarchy
        const employeeId = draggedNode ? draggedNode.employee_number : draggingUnassigned.employee_number;
        await handleRemoveFromHierarchy(employeeId);
      }
    }

    // Reset all drag states
    setIsDragging(false);
    setIsDraggingNode(false);
    setDraggedNode(null);
    setDraggingUnassigned(null);
    setDropTarget(null);
    setIsOverTrash(false);
    setDragOffset({ x: 0, y: 0 });
    
    canvas.style.cursor = 'default';
  };

  const handleClick = (e) => {
    if (isDragging || isDraggingNode) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left - position.x) / scale;
    const mouseY = (e.clientY - rect.top - position.y) / scale;

    const clickedNode = getNodeAtPosition(mouseX, mouseY);

    if (clickedNode) {
      const imgX = clickedNode.x - 100;
      const imgY = clickedNode.y - clickedNode.height / 2 + 60;
      const imgSize = 200;
      
      const isOnImage = mouseX >= imgX && mouseX <= imgX + imgSize && 
                        mouseY >= imgY && mouseY <= imgY + imgSize;
      
      if (isOnImage) {
        setSelectedEmployee(clickedNode);
        setShowDetails(true);
        return;
      }

      if (clickedNode.hasChildren) {
        setExpandedNodes(prev => {
          const newSet = new Set(prev);
          if (newSet.has(clickedNode.employee_number)) {
            newSet.delete(clickedNode.employee_number);
          } else {
            newSet.add(clickedNode.employee_number);
          }
          return newSet;
        });
      }
    }
  };

  const resetView = () => {
    setScale(1);
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      const centerX = rect.width / 2;
      const centerY = 100;
      setPosition({ x: centerX, y: centerY });
    }
  };

  const expandAll = () => {
    const allNodes = new Set();
    const collectNodes = (node) => {
      if (node) {
        allNodes.add(node.employee_number);
        if (node.children) {
          node.children.forEach(collectNodes);
        }
      }
    };
    collectNodes(treeData);
    setExpandedNodes(allNodes);
  };

  const collapseAll = () => {
    setExpandedNodes(new Set([treeData?.employee_number].filter(Boolean)));
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-ZA', {
      style: 'currency',
      currency: 'ZAR',
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-ZA');
  };

  if (!treeData) {
    return <div className={styles.loading}>Loading hierarchy...</div>;
  }

  return (
    <div className={styles.treeWrapper}>
      <div className={styles.controls}>
        <form onSubmit={handleSearch} className={styles.searchForm}>
          <input
            type="text"
            placeholder="Search by name or employee number"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className={styles.searchInput}
            disabled={isUpdating}
          />
          <button type="submit" className={styles.searchButton} disabled={isUpdating}>
            Search
          </button>
          {foundNode && (
            <button 
              type="button" 
              onClick={centerFoundNode}
              className={styles.centerButton}
              disabled={isUpdating}
            >
              Center
            </button>
          )}
        </form>

        <div className={styles.unassignedDropdownContainer}>
          <button 
            type="button" 
            onClick={async () => {
              if (!showUnassignedDropdown) {
                try {
                  const response = await fetch('/api/not_assigned');
                  const data = await response.json();
                  setUnassignedEmployees(data);
                } catch (err) {
                  console.error('Error fetching unassigned employees:', err);
                }
              }
              setShowUnassignedDropdown(!showUnassignedDropdown);
            }}
            className={styles.addEmployeeButton}
            disabled={isUpdating}
          >
            Add Unassigned Employee
          </button>
          
          {showUnassignedDropdown && (
            <div className={styles.unassignedDropdown}>
              {unassignedEmployees.length > 0 ? (
                unassignedEmployees.map(emp => (
                  <div 
                    key={emp.employee_number}
                    className={styles.unassignedEmployee}
                    draggable
                    onDragStart={() => handleUnassignedDragStart(emp)}
                    onClick={() => handleUnassignedDragStart(emp)}
                  >
                    {emp.employee_number}: {emp.name} {emp.surname}
                  </div>
                ))
              ) : (
                <div className={styles.noUnassigned}>No unassigned employees</div>
              )}
            </div>
          )}
        </div>
        
        <button onClick={resetView} className={styles.resetButton} disabled={isUpdating}>
          Reset View
        </button>
        
        <button onClick={expandAll} className={styles.expandButton} disabled={isUpdating}>
          Expand All
        </button>
        
        <button onClick={collapseAll} className={styles.collapseButton} disabled={isUpdating}>
          Collapse All
        </button>

        <div className={styles.zoomInfo}>
          Zoom: {Math.round(scale * 100)}%
        </div>

        {isUpdating && (
          <div className={styles.updateIndicator}>
            Updating hierarchy...
          </div>
        )}

        {isDraggingNode && draggedNode && (
          <div className={styles.dragIndicator}>
            Dragging: {draggedNode.name}
            {dropTarget && (
              <div>Drop target: {employeeData[dropTarget]?.name} {employeeData[dropTarget]?.surname}</div>
            )}
          </div>
        )}
      </div>

      <canvas
        ref={canvasRef}
        className={styles.treeContainer}
        onMouseMove={handleMouseMove}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleClick}
        style={{ 
          cursor: isDraggingNode ? 'grabbing' : 'default',
          pointerEvents: isUpdating ? 'none' : 'auto'
        }}
      />

      {/* Employee Details Modal */}
      {showDetails && selectedEmployee && (
        <div className={styles.modalOverlay} onClick={() => setShowDetails(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalHeader}>
              <h3>Employee Details</h3>
              <button 
                className={styles.closeButton} 
                onClick={() => setShowDetails(false)}
              >
                ×
              </button>
            </div>
            
            <div className={styles.modalBody}>
              {selectedEmployee.data && Object.keys(selectedEmployee.data).length > 0 ? (
                <div className={styles.employeeDetails}>
                  <img
                    src={selectedEmployee.data.gravatarUrl || '/images/default-avatar.png'}
                    alt="Gravatar"
                    className={styles.modalGravatar}
                    width={64}
                    height={64}
                    style={{ borderRadius: '50%', marginBottom: '1rem' }}
                  />
                  <div className={styles.modalActions}>
                    <button 
                      className={styles.removeButton}
                      onClick={() => {
                        if (confirm(`Are you sure you want to remove ${selectedEmployee.name} from the hierarchy?`)) {
                          handleRemoveFromHierarchy(selectedEmployee.employee_number);
                          setShowDetails(false);
                        }
                      }}
                      disabled={isUpdating}
                    >
                      Remove from Hierarchy
                    </button>
                  </div>
                  <div className={styles.detailRow}>
                    <span className={styles.label}>Employee Number:</span>
                    <span className={styles.value}>{selectedEmployee.data.employee_number}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Full Name:</span>
                    <span className={styles.value}>
                      {selectedEmployee.data.name} {selectedEmployee.data.surname}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Branch Number:</span>
                    <span className={styles.value}>{selectedEmployee.data.branch_name || 'Unknown Branch'}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Department:</span>
                    <span className={styles.value}>{selectedEmployee.data.dept_name || 'Unknown Department'}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Role:</span>
                    <span className={styles.value}>{selectedEmployee.data.role_name || 'Unknown Role'}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Email:</span>
                    <span className={styles.value}>{selectedEmployee.data.email || 'N/A'}</span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Birth Date:</span>
                    <span className={styles.value}>
                      {selectedEmployee.data.birth_date ? formatDate(selectedEmployee.data.birth_date) : 'N/A'}
                    </span>
                  </div>

                  <div className={styles.detailRow}>
                    <span className={styles.label}>Salary:</span>
                    <span className={styles.value}>
                      {selectedEmployee.data.salary ? formatCurrency(selectedEmployee.data.salary) : 'N/A'}
                    </span>
                  </div>
                </div>
              ) : (
                <p>No detailed information available for this employee.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}