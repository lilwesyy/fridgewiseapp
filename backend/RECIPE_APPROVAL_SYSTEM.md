# Recipe Approval System

This document describes the recipe approval system implemented to prevent inappropriate recipes from being published publicly.

## Overview

All recipes that users cook (by marking them as completed) now require admin approval before becoming visible in the public recipes section.

## System Flow

```
User cooks recipe → Status: pending_approval → Admin reviews → Status: approved/rejected → Public visibility
```

## Recipe Status Values

- **`private`**: Default status for new recipes
- **`pending_approval`**: Recipe has been cooked and is waiting for admin review
- **`approved`**: Recipe has been approved by an admin and is visible publicly
- **`rejected`**: Recipe has been rejected by an admin with a reason

## Database Schema

The `Recipe` model has been extended with these fields:

```typescript
{
  status: 'private' | 'pending_approval' | 'approved' | 'rejected',
  approvedBy?: ObjectId,        // Admin who approved/rejected
  approvedAt?: Date,            // When the decision was made
  rejectionReason?: string      // Reason for rejection (if rejected)
}
```

## API Endpoints

### Admin Endpoints (Require admin role)

- **GET** `/api/recipe/admin/pending` - Get recipes waiting for approval
- **POST** `/api/recipe/admin/approve/:id` - Approve a recipe
- **POST** `/api/recipe/admin/reject/:id` - Reject a recipe (requires reason)

### Modified Endpoints

- **GET** `/api/recipe/public` - Now only returns approved recipes
- **POST** `/api/recipe/save-public/:id` - Only works with approved recipes
- **POST** `/api/recipe/complete/:id` - Sets status to 'pending_approval'

## Frontend Interface

### Admin Panel
Located in: `ProfileScreen → Admin Section → Recipe Approvals`

Features:
- View all pending recipes with details
- Approve/reject recipes with one click
- Provide rejection reasons
- Real-time updates

### User Experience
- Users cook recipes normally
- Recipes become "pending approval" automatically
- No disruption to existing workflow
- Rejected recipes remain private with reason visible to user

## Migration Script

### Usage
```bash
# View current statistics
npm run migrate-recipe-status stats

# Run migration for existing recipes
npm run migrate-recipe-status migrate
```

### What it does
- Finds existing recipes that are already public (have photos or been cooked)
- Marks them as 'approved' to maintain backward compatibility
- Provides detailed statistics and confirmation prompts

### Production Safety
- Requires `CONFIRM_MIGRATION=true` in production
- Shows detailed migration plan before execution
- Provides rollback information

## Security Considerations

1. **Admin-only access**: All approval endpoints require admin role
2. **Input validation**: Rejection reasons are validated (1-500 characters)
3. **Audit trail**: All approvals/rejections are logged with timestamp and admin ID
4. **Rate limiting**: Standard rate limits apply to all endpoints

## Monitoring

### Key Metrics to Monitor
- Number of pending recipes
- Average approval time
- Rejection rate and reasons
- Public recipes growth rate

### Logs to Watch
- Recipe status transitions
- Admin approval actions
- Failed approval attempts
- Migration script runs

## Best Practices

### For Admins
1. Review recipes promptly to maintain user engagement
2. Provide clear, constructive rejection reasons
3. Be consistent with approval criteria
4. Monitor for patterns in rejected content

### For Developers
1. Always test status transitions in development
2. Use the migration script for any data changes
3. Monitor cache invalidation after approvals
4. Keep audit trails for compliance

## Troubleshooting

### Common Issues

**Public recipes not showing after approval**
- Check cache invalidation in `CacheService.invalidatePublicRecipesCache()`
- Verify query filters in `getPublicRecipes`

**Migration script fails**
- Check MongoDB connection string
- Verify user permissions
- Check for data consistency issues

**Admin panel not accessible**
- Verify user has `role: 'admin'`
- Check authentication token validity
- Verify API endpoint accessibility

### Debug Commands
```bash
# Check recipe status distribution
npm run migrate-recipe-status stats

# View detailed logs
tail -f logs/app.log | grep -i recipe

# Test API endpoints
curl -H "Authorization: Bearer <token>" http://localhost:3001/api/recipe/admin/pending
```

## Future Enhancements

### Potential Features
1. **Automated moderation**: AI-powered initial screening
2. **Batch operations**: Approve/reject multiple recipes
3. **Review categories**: Different approval workflows for different recipe types
4. **Appeal system**: Allow users to appeal rejections
5. **Delegation**: Allow multiple admin levels
6. **Analytics dashboard**: Detailed approval statistics

### Scaling Considerations
1. **Queue system**: For high-volume approval workflows
2. **Notification system**: Real-time alerts for admins
3. **Approval workflows**: Multi-step approval process
4. **Automated escalation**: Flag recipes requiring special attention

## Rollback Plan

If the approval system needs to be temporarily disabled:

1. **Quick disable**: Update `getPublicRecipes` to ignore status filter
2. **Full rollback**: Run migration script in reverse (mark all as approved)
3. **Emergency bypass**: Add environment variable to skip approval checks

## Support

For questions or issues with the recipe approval system:
- Check this documentation first
- Review the migration script logs
- Test with the stats command
- Contact the development team

---

**Last Updated**: January 2025
**Version**: 1.0.0