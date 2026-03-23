import React, { useState } from 'react';
import { useAdminContract } from '../../hooks/useAdminContract';
import './RoleManagement.css';

interface IssuerManagementProps {
  isOwner: boolean;
}

const IssuerManagement: React.FC<IssuerManagementProps> = ({ isOwner }) => {
  const { addIssuer, removeIssuer, checkIsIssuer } = useAdminContract();

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
      await addIssuer(addAddress);
      setMessage({ type: 'success', text: 'Issuer added successfully' });
      setAddAddress('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to add issuer';
      setMessage({ type: 'error', text: errorMessage.includes('Already issuer') ? 'Address is already an issuer' : 'Failed to add issuer' });
    }
    setIsLoading(false);
  };

  const handleCheck = async () => {
    if (!checkAddress) return;
    setIsLoading(true);
    setCheckResult(null);
    try {
      const result = await checkIsIssuer(checkAddress);
      setCheckResult(result);
    } catch {
      setMessage({ type: 'error', text: 'Failed to check issuer status' });
    }
    setIsLoading(false);
  };

  const handleRemove = async () => {
    if (!removeAddress) return;
    setIsLoading(true);
    setMessage(null);
    try {
      await removeIssuer(removeAddress);
      setMessage({ type: 'success', text: 'Issuer removed successfully' });
      setRemoveAddress('');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to remove issuer';
      setMessage({ type: 'error', text: errorMessage.includes('Not an issuer') ? 'Address is not an issuer' : 'Failed to remove issuer' });
    }
    setIsLoading(false);
  };

  return (
    <div className="role-card">
      <h3 className="role-card-title">Issuer Management</h3>

      {message && (
        <div className={`role-message ${message.type}`}>{message.text}</div>
      )}

      {/* Add Issuer */}
      <div className="role-section">
        <label className="role-label">Add Issuer</label>
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

      {/* Check Issuer */}
      <div className="role-section">
        <label className="role-label">Check Issuer</label>
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
            {checkResult ? 'Is an issuer' : 'Not an issuer'}
          </div>
        )}
      </div>

      {/* Remove Issuer */}
      <div className="role-section">
        <label className="role-label">Remove Issuer</label>
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
        <p className="role-warning">Only the owner can add/remove issuers</p>
      )}
    </div>
  );
};

export default IssuerManagement;
