import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ManagerManagement from '../ManagerManagement';

// Mock the useAdminContract hook
const mockAddManager = vi.fn();
const mockRemoveManager = vi.fn();
const mockCheckIsManager = vi.fn();

vi.mock('../../../hooks/useAdminContract', () => ({
  useAdminContract: () => ({
    addManager: mockAddManager,
    removeManager: mockRemoveManager,
    checkIsManager: mockCheckIsManager,
  }),
}));

describe('ManagerManagement', () => {
  const testAddress = '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
    mockAddManager.mockResolvedValue(true);
    mockRemoveManager.mockResolvedValue(true);
    mockCheckIsManager.mockResolvedValue(false);
  });

  describe('Rendering', () => {
    it('renders the component title', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByText('Manager Management')).toBeInTheDocument();
    });

    it('renders add manager section', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByText('Add Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('renders check manager section', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByText('Check Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Check' })).toBeInTheDocument();
    });

    it('renders remove manager section', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByText('Remove Manager')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Remove' })).toBeInTheDocument();
    });

    it('shows warning when user is not owner', () => {
      render(<ManagerManagement isOwner={false} />);

      expect(screen.getByText('Only the owner can add/remove managers')).toBeInTheDocument();
    });

    it('does not show warning when user is owner', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.queryByText('Only the owner can add/remove managers')).not.toBeInTheDocument();
    });
  });

  describe('Add Manager', () => {
    it('disables add button when not owner', () => {
      render(<ManagerManagement isOwner={false} />);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('disables add button when input is empty', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('enables add button when owner and input has value', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);

      expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
    });

    it('calls addManager when add button is clicked', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(mockAddManager).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows success message on successful add', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Manager added successfully')).toBeInTheDocument();
      });
    });

    it('clears input after successful add', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(inputs[0]).toHaveValue('');
      });
    });

    it('shows error message when address is already a manager', async () => {
      const user = userEvent.setup();
      mockAddManager.mockRejectedValue(new Error('Already manager'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Address is already a manager')).toBeInTheDocument();
      });
    });

    it('shows generic error message on other failures', async () => {
      const user = userEvent.setup();
      mockAddManager.mockRejectedValue(new Error('Network error'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to add manager')).toBeInTheDocument();
      });
    });
  });

  describe('Check Manager', () => {
    it('check button is not disabled based on owner status', () => {
      render(<ManagerManagement isOwner={false} />);

      // Check button should only be disabled if input is empty
      expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    });

    it('disables check button when input is empty', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Check' })).toBeDisabled();
    });

    it('calls checkIsManager when check button is clicked', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(mockCheckIsManager).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows "Is a manager" when address is manager', async () => {
      const user = userEvent.setup();
      mockCheckIsManager.mockResolvedValue(true);

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Is a manager')).toBeInTheDocument();
      });
    });

    it('shows "Not a manager" when address is not manager', async () => {
      const user = userEvent.setup();
      mockCheckIsManager.mockResolvedValue(false);

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Not a manager')).toBeInTheDocument();
      });
    });

    it('clears check result when input changes', async () => {
      const user = userEvent.setup();
      mockCheckIsManager.mockResolvedValue(true);

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Is a manager')).toBeInTheDocument();
      });

      // Type more characters
      await user.type(inputs[1], '1');

      expect(screen.queryByText('Is a manager')).not.toBeInTheDocument();
    });

    it('shows error message on check failure', async () => {
      const user = userEvent.setup();
      mockCheckIsManager.mockRejectedValue(new Error('Network error'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);
      await user.click(screen.getByRole('button', { name: 'Check' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to check manager status')).toBeInTheDocument();
      });
    });
  });

  describe('Remove Manager', () => {
    it('disables remove button when not owner', () => {
      render(<ManagerManagement isOwner={false} />);

      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('disables remove button when input is empty', () => {
      render(<ManagerManagement isOwner={true} />);

      expect(screen.getByRole('button', { name: 'Remove' })).toBeDisabled();
    });

    it('calls removeManager when remove button is clicked', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(mockRemoveManager).toHaveBeenCalledWith(testAddress);
      });
    });

    it('shows success message on successful remove', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Manager removed successfully')).toBeInTheDocument();
      });
    });

    it('clears input after successful remove', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(inputs[2]).toHaveValue('');
      });
    });

    it('shows error message when address is not a manager', async () => {
      const user = userEvent.setup();
      mockRemoveManager.mockRejectedValue(new Error('Not a manager'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Address is not a manager')).toBeInTheDocument();
      });
    });

    it('shows generic error message on other failures', async () => {
      const user = userEvent.setup();
      mockRemoveManager.mockRejectedValue(new Error('Network error'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to remove manager')).toBeInTheDocument();
      });
    });
  });

  describe('Loading State', () => {
    it('disables all inputs during loading', async () => {
      const user = userEvent.setup();
      let resolvePromise: () => void;
      mockAddManager.mockImplementation(() => new Promise(resolve => { resolvePromise = () => resolve(true); }));

      render(<ManagerManagement isOwner={true} />);

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
      mockAddManager.mockImplementation(() => new Promise(resolve => { resolvePromise = () => resolve(true); }));

      render(<ManagerManagement isOwner={true} />);

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
        expect(screen.getByText('Manager added successfully')).toBeInTheDocument();
      });
    });
  });

  describe('Empty Input Handling', () => {
    it('does not call addManager when add address is empty', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const addButton = screen.getByRole('button', { name: 'Add' });
      await user.click(addButton);

      expect(mockAddManager).not.toHaveBeenCalled();
    });

    it('does not call checkIsManager when check address is empty', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const checkButton = screen.getByRole('button', { name: 'Check' });
      await user.click(checkButton);

      expect(mockCheckIsManager).not.toHaveBeenCalled();
    });

    it('does not call removeManager when remove address is empty', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const removeButton = screen.getByRole('button', { name: 'Remove' });
      await user.click(removeButton);

      expect(mockRemoveManager).not.toHaveBeenCalled();
    });
  });

  describe('Multiple Operations', () => {
    it('handles sequential add and remove operations', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');

      // Add manager
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Manager added successfully')).toBeInTheDocument();
      });

      // Remove manager
      await user.type(inputs[2], testAddress);
      await user.click(screen.getByRole('button', { name: 'Remove' }));

      await waitFor(() => {
        expect(screen.getByText('Manager removed successfully')).toBeInTheDocument();
      });
    });

    it('can perform check without owner privileges', async () => {
      const user = userEvent.setup();
      mockCheckIsManager.mockResolvedValue(true);

      render(<ManagerManagement isOwner={false} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[1], testAddress);

      // Check button should be enabled (only owner is required for add/remove)
      const checkButton = screen.getByRole('button', { name: 'Check' });
      expect(checkButton).not.toBeDisabled();

      await user.click(checkButton);

      await waitFor(() => {
        expect(screen.getByText('Is a manager')).toBeInTheDocument();
      });
    });
  });

  describe('Input Validation', () => {
    it('accepts any string input for address', async () => {
      const user = userEvent.setup();

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], 'invalid-address');

      expect(inputs[0]).toHaveValue('invalid-address');
      expect(screen.getByRole('button', { name: 'Add' })).not.toBeDisabled();
    });

    it('preserves input value on failed operation', async () => {
      const user = userEvent.setup();
      mockAddManager.mockRejectedValue(new Error('Invalid address'));

      render(<ManagerManagement isOwner={true} />);

      const inputs = screen.getAllByPlaceholderText('0x...');
      await user.type(inputs[0], testAddress);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await waitFor(() => {
        expect(screen.getByText('Failed to add manager')).toBeInTheDocument();
      });

      // Input should still have the value (not cleared on failure)
      expect(inputs[0]).toHaveValue(testAddress);
    });
  });
});
