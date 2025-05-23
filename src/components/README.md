# Room Component Refactoring

This directory contains the refactored Room component that has been broken down into smaller, more manageable pieces for better code readability and maintainability.

## Component Structure

### Main Component

- **`Room.tsx`** - The main component that orchestrates all the pieces together

### UI Components

- **`RoomHeader.tsx`** - Header with title and end chat button
- **`ConnectionStatusBar.tsx`** - Displays connection errors and refresh option
- **`VideoDisplay.tsx`** - Reusable video display component for both local and remote videos
- **`LoadingIndicator.tsx`** - Loading spinner with message
- **`DeviceSelector.tsx`** - Dropdown for selecting video/audio devices
- **`MediaControls.tsx`** - All media control buttons (video/audio toggle, device selection, next/end)

### Custom Hooks

- **`../hooks/useSocket.ts`** - Manages Socket.io connection and event handling
- **`../hooks/useWebRTC.ts`** - Manages WebRTC peer connections and media streams

## Key Benefits

1. **Separation of Concerns**: Each component has a single responsibility
2. **Reusability**: Components like `VideoDisplay` and `DeviceSelector` can be reused
3. **Maintainability**: Easier to debug and maintain smaller components
4. **Testability**: Individual components can be unit tested in isolation
5. **Code Organization**: Related functionality is grouped together

## WebRTC Logic

The WebRTC logic has been extracted into a custom hook (`useWebRTC`) that handles:

- Peer connection creation and management
- ICE candidate handling
- Track replacement for device switching
- Connection state monitoring

## Socket Logic

The Socket.io logic has been extracted into a custom hook (`useSocket`) that handles:

- Socket connection management
- Event listener setup and cleanup
- Connection error handling
- Reconnection logic

## Usage

The main `Room` component now uses these smaller components and hooks to compose the complete functionality while maintaining clean separation of concerns.
