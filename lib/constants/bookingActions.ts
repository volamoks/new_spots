import BookingRole from '@/lib/enums/BookingRole';

interface BookingActionConfig {
  buttonText: string;
  successMessage: string;
}

interface BookingActionsConfig {
  [role: string]: {
    [action: string]: BookingActionConfig;
  };
}

const BOOKING_ACTIONS_CONFIG: BookingActionsConfig = {
  [BookingRole.KM]: {
    approve: {
      buttonText: 'Approve',
      successMessage: 'Booking approved successfully.',
    },
    reject: {
      buttonText: 'Reject',
      successMessage: 'Booking rejected successfully.',
    },
  },
  [BookingRole.DMP]: {
    approve: {
      buttonText: 'Approve',
      successMessage: 'Booking approved successfully.',
    },
    reject: {
      buttonText: 'Reject',
      successMessage: 'Booking rejected successfully.',
    },
  },
  // Add other roles and actions as needed
};

export { BOOKING_ACTIONS_CONFIG };