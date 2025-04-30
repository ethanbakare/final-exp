# Calendar Mobile Enhancement Tasks

> *Documentation for improving the DatePickerCalendar component in the receipt-scanner project for better mobile usability. This document outlines the implementation plan to address touch target sizes, typography, feedback, and responsive behaviors.*

## 1. Increase Touch Target Sizes

- **Increase navigation arrows (20×20px → 44×44px)**
  1. Update `.month-nav-button` CSS to increase width/height to 44px
  2. Center the SVG icon within the larger touch target
  3. Adjust surrounding layout to accommodate larger buttons

- **Enlarge day cells (36×36px → 44×44px)**
  1. Modify grid layout in `.calendar-days` to use 44px cells
  2. Update `baseContainerStyle` in calendar day generation
  3. Adjust overall calendar container width to accommodate larger cells

## 2. Improve Typography & Readability

- **Increase weekday header font size (10px → 14-16px)**
  1. Update `.weekday-cell` font-size to 14px or 16px
  2. Adjust height of header to maintain vertical rhythm
  3. Consider using responsive font sizing for different viewports

- **Increase day numbers font size (11.9px → 14-16px)**
  1. Modify `baseNumberStyle` in calendar day generation code
  2. Update font-size to 14px or 16px
  3. Ensure sufficient spacing between numbers in the grid

## 3. Add Touch Feedback

- **Implement visible state changes on touch/tap**
  1. Add active/pressed state styles for all interactive elements
  2. Include `:active` CSS selectors for touch feedback
  3. Consider using opacity or background-color changes for feedback

- **Ensure active state is clearly distinguished**
  1. Create distinctive active states for calendar days
  2. Add transition effects for smoother state changes
  3. Test on actual mobile devices to verify feedback is noticeable

## 4. Responsive Layout Adjustments

- **Implement responsive sizing for different screen widths**
  1. Add media queries for different viewport breakpoints
  2. Scale calendar container size based on available width
  3. Use relative units (%, rem) instead of fixed pixels where possible

- **Consider full-width calendar view on smaller screens**
  1. Detect viewport width and conditionally adjust calendar width
  2. For screens under 375px, make calendar expand to full width
  3. Adjust internal padding and margins for smaller screens

## 5. Native-Feeling Interaction Patterns

- **Research platform-specific date picker patterns**
  1. Review iOS and Android date picker design guidelines
  2. Identify common patterns that users are familiar with
  3. Prioritize implementations that match platform expectations

- **Consider swipe gestures for month navigation**
  1. Add touch event listeners for horizontal swipe detection
  2. Implement month change on successful swipe gesture
  3. Add visual feedback during swipe interaction

## Related Files

- `final-exp/src/projects/receipt-scanner/components/ui/DatePickerCalendar.tsx`
- `final-exp/src/projects/receipt-scanner/components/ui/ListItem.tsx`
- `final-exp/src/projects/receipt-scanner/styles/Components.module.css` 