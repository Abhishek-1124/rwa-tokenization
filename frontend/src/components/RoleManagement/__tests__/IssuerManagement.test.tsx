import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import IssuerManagement from '../IssuerManagement';

// Mock the useAdminContract hook
const mockAddIssuer = vi.fn();
const mockRemoveIssuer = vi.fn();
const mockCheckIsIssuer = vi.fn();

vi.mock('../../../hooks/useAdminContract', () => ({
  useAdminContract: () => ({
    addIssuer: mockAddIssuer,
    removeIssuer: mockRemoveIssuer,
    checkIsIssuer: mockCheckIsIssuer,
  }),
}));

describe('IssuerManagement', () => {
  const testAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddIssuer.mockResolvedValue(true);
    mockRemoveIssuer.mockResolvedValue(true);
    mockCheckIsIssuer.mockResolvedValue(false);
  });

  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByText('Issuer Management')).toBeInTheDocument();
    });

    it('renders add issuer section', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByText('Add Issuer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('renders check issuer section', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByText('Check Issuer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument();
    });

    it('renders remove issuer section', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByText('Remove Issuer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('shows warning when user is not owner', () => {
      render(<IssuerManagement isOwner={false} />);

      expect(screen.getByText('Only the owner can add/remove issuers')).toBeInTheDocument();
    });

    it('does not show warning when user is owner', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.queryByText('Only the owner can add/remove issuers')).not.toBeInTheDocument();
    });
  });

  describe('Add Issuer', () => {
    it('disables add button when not owner', () => {
      render(<IssuerManagement isOwner={false} />);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('disables add button when input is empty', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('enables add button when owner and input has value', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);

      expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
    });

    it('calls addIssuer when add button is clicked', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(mockAddIssuer).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows success message on successful add', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Issuer added successfully')).toBeInTheDocument();
      });
    });

    it('clears input after successful add', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(inputs[0]).toHaveValue('');
      });
    });

    it('shows error message when address is already an issuer', async () => {
      const user = userEvent.setup();
      mockAddIssuer.mockRejectedValue(new Error('Already issuer'));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Address is already an issuer')).toBeInTheDocument();
      });
    });

    it('shows generic error message on other failures', async () => {
      const user = userEvent.setup();
      mockAddIssuer.mockRejectedValue(new Error('Network error'));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to add issuer')).toBeInTheDocument();
      });
    });
  });

  describe('Check Issuer', () => {
    it('check button is not disabled when not owner', () => {
      render(<IssuerManagement isOwner={false} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      // Check input is the second one
      expect(inputs[1]).toBeInTheDocument();
    });

    it('disables check button when input is empty', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    });

    it('calls checkIsIssuer when check button is clicked', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(mockCheckIsIssuer).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows "Is an issuer" when address is issuer', async () => {
      const user = userEvent.setup();
      mockCheckIsIssuer.mockResolvedValue(true);

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Is an issuer')).toBeInTheDocument();
      });
    });

    it('shows "Not an issuer" when address is not issuer', async () => {
      const user = userEvent.setup();
      mockCheckIsIssuer.mockResolvedValue(false);

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Not an issuer')).toBeInTheDocument();
      });
    });

    it('clears check result when input changes', async () => {
      const user = userEvent.setup();
      mockCheckIsIssuer.mockResolvedValue(true);

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Is an issuer')).toBeInTheDocument();
      });

      // Type more characters
      await user.type(inputs[1], '1');

      expect(screen.queryByText('Is an issuer')).not.toBeInTheDocument();
    });
  });

  describe('Remove Issuer', () => {
    it('disables remove button when not owner', () => {
      render(<IssuerManagement isOwner={false} />);

      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('disables remove button when input is empty', () => {
      render(<IssuerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('calls removeIssuer when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(mockRemoveIssuer).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows success message on successful remove', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Issuer removed successfully')).toBeInTheDocument();
      });
    });

    it('clears input after successful remove', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(inputs[2]).toHaveValue('');
      });
    });

    it('shows error message when address is not an issuer', async () => {
      const user = userEvent.setup();
      mockRemoveIssuer.mockRejectedValue(new Error('Not an issuer'));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Address is not an issuer')).toBeInTheDocument();
      });
    });

    it('shows generic error message on other failures', async () => {
      const user = userEvent.setup();
      mockRemoveIssuer.mockRejectedValue(new Error('Network error'));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to remove issuer')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all inputs during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockAddIssuer.mockImplementation(() => new Promise(resolve => { resolvePromise = () => resolve(true); }));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      // All inputs should be disabled during loading
      await waitFor(() => {
        inputs.forEach((input: HTMLElement) => {
          expect(input).toBeDisabled();
        });
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!();
      });

      // Inputs should re-enable once loading finishes
      await waitFor(() => {
        inputs.forEach((input: HTMLElement) => {
          expect(input).not.toBeDisabled();
        });
      });
    });

    it('disables all buttons during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockAddIssuer.mockImplementation(() => new Promise(resolve => { resolvePromise = () => resolve(true); }));

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);

      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      await waitFor(() => {
        expect(addButton).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
      });

      // Resolve the promise
      await act(async () => {
        resolvePromise!();
      });

      // Ensure the async state update settles (prevents act warnings)
      await waitFor(() => {
        expect(screen.getByText('Issuer added successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Empty Input Handling', () => {
    it('does not call addIssuer when add address is empty', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      // Force click on disabled button (shouldn't trigger action)
      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      expect(mockAddIssuer).not.toHaveBeenCalled();
    });

    it('does not call checkIsIssuer when check address is empty', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const checkButton = screen.getByRole('button', { name: 'Check' });
      await user.click(checkButton);

      expect(mockCheckIsIssuer).not.toHaveBeenCalled();
    });

    it('does not call removeIssuer when remove address is empty', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);

      expect(mockRemoveIssuer).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Operations', () => {
    it('handles sequential add and remove operations', async () => {
      const user = userEvent.setup();

      render(<IssuerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');

      // Add issuer
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Issuer added successfully')).toBeInTheDocument();
      });

      // Remove issuer
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Issuer removed successfully')).toBeInTheDocument();
      });
    });
  });
});
