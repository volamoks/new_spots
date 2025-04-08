// Import the renamed component
import AccountApprovalPageContent from '../components/verify-km/page';

// Renamed the export to avoid naming conflict, kept original page structure
export const ApprovalPageWrapper = () => {
    return <AccountApprovalPageContent />;
};
export default ApprovalPageWrapper;
