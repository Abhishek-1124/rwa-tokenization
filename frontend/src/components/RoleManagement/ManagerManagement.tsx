import React, { useState } from 'react';
import { useAdminContract } from '../../hooks/useAdminContract';
import './RoleManagement.css';

interface ManagerManagementProps {
  isOwner: boolean;
}

const ManagerManagement: React.FC<ManagerManagementProps> = ({ isOwner }) => {
  const { addManager, removeManager, checkIsManager } = useAdminContract();

  const [addAddress, setAddAddress] = useState('');
  const [checkAddress, setCheckAddress] = useState('');
  const [removeAddress, setRemoveAddress] = useState('');
  const [checkResult, setCheckResult] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  const handleAdd = async () => {
    if (!addAddress) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await addManager(addAddress);
      setMessage({ type: 'success', text: 'Manager added successfully' });
      setAddAddress('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add manager';
      setMessage({ type: 'error', text: errorMessage.includes('Already manager') ? 'Address is already a manager' : 'Failed to add manager' });
    }
    setIsLoading(false);
  };

  const handleCheck = async () => {
    if (!checkAddress) return;
    setIsLoading(true);
    setCheckResult(null);
    try {
      const result = await checkIsManager(checkAddress);
      setCheckResult(result);
    } catch {
      setMessage({ type: 'error', text: 'Failed to check manager status' });
    }
    setIsLoading(false);
  };

  const handleRemove = async () => {
    if (!removeAddress) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await removeManager(removeAddress);
      setMessage({ type: 'success', text: 'Manager removed successfully' });
      setRemoveAddress('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove manager';
      setMessage({ type: 'error', text: errorMessage.includes('Not a manager') ? 'Address is not a manager' : 'Failed to remove manager' });
    }
    setIsLoading(false);
  };

  return (
    <div className="role-card">
      <h3 className="role-card-title">Manager Management</h3>

      {message && (
        <div className={`role-message ${message.type}`}>{message.text}</div>
      )}

      {/* Add Manager */}
      <div className="role-section">
        <label className="role-label">Add Manager</label>
        <div className="role-input-row">
          <input
            type="text"
            value={addAddress}
            onChange={(e) => setAddAddress(e.target.value)}
            placeholder="0x..."
            className="role-input"
            disabled={isLoading}
          />
          <button
            onClick={handleAdd}
            className="role-btn add"
            disabled={!isOwner || isLoading || !addAddress}
          >
            Add
          </button>
        </div>
      </div>

      {/* Check Manager */}
      <div className="role-section">
        <label className="role-label">Check Manager</label>
        <div className="role-input-row">
          <input
            type="text"
            value={checkAddress}
            onChange={(e) => {
              setCheckAddress(e.target.value);
              setCheckResult(null);
            }}
            placeholder="0x..."
            className="role-input"
            disabled={isLoading}
          />
          <button
            onClick={handleCheck}
            className="role-btn check"
            disabled={isLoading || !checkAddress}
          >
            Check
          </button>
        </div>
        {checkResult !== null && (
          <div className={`role-result ${checkResult ? 'is-role' : 'not-role'}`}>
            {checkResult ? 'Is a manager' : 'Not a manager'}
          </div>
        )}
      </div>

      {/* Remove Manager */}
      <div className="role-section">
        <label className="role-label">Remove Manager</label>
        <div className="role-input-row">
          <input
            type="text"
            value={removeAddress}
            onChange={(e) => setRemoveAddress(e.target.value)}
            placeholder="0x..."
            className="role-input"
            disabled={isLoading}
          />
          <button
            onClick={handleRemove}
            className="role-btn remove"
            disabled={!isOwner || isLoading || !removeAddress}
          >
            Remove
          </button>
        </div>
      </div>

      {!isOwner && (
        <p className="role-warning">Only the owner can add/remove managers</p>
      )}
    </div>
  );
};

export default ManagerManagement;
