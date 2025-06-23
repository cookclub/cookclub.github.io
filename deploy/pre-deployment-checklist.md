# Pre-Deployment Checklist

## Configuration Verification
- [ ] Update `SCRIPT_URL` in `js/config.js` with production Google Apps Script URL
- [ ] Verify all API endpoints are working in production
- [ ] Test Discord webhook integration
- [ ] Confirm Google Sheets permissions and access

## Code Quality
- [ ] Run all tests and ensure they pass
- [ ] Check for console errors in browser
- [ ] Validate HTML markup
- [ ] Test CSS across different browsers
- [ ] Verify responsive design on mobile devices

## Performance Optimization
- [ ] Minify CSS and JavaScript files
- [ ] Optimize images and assets
- [ ] Test page load speeds
- [ ] Verify API response times

## Security Review
- [ ] Ensure no sensitive data in client-side code
- [ ] Verify HTTPS usage for all external requests
- [ ] Check for XSS vulnerabilities
- [ ] Validate input sanitization

## Accessibility Compliance
- [ ] Test with screen readers
- [ ] Verify keyboard navigation
- [ ] Check color contrast ratios
- [ ] Validate ARIA attributes

## Browser Compatibility
- [ ] Test in Chrome (latest)
- [ ] Test in Firefox (latest)
- [ ] Test in Safari (latest)
- [ ] Test in Edge (latest)
- [ ] Test on mobile browsers

## Functionality Testing
- [ ] Complete RSVP flow for members
- [ ] Complete RSVP flow for guests
- [ ] Recipe selection and claiming
- [ ] Menu display and updates
- [ ] Form validation and error handling
- [ ] Real-time updates and notifications

## Documentation
- [ ] Update README with deployment instructions
- [ ] Document any configuration changes
- [ ] Create user guide for club members
- [ ] Document troubleshooting procedures