import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagButton, TagsDisplay, getLabelPosition } from '@/components/PostActions/TagFeatures';

// Mock console.error to test error handling
const mockConsoleError = vi.fn();
global.console.error = mockConsoleError;

describe('TagButton', () => {
  const mockOnToggleTags = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders correctly when tags are not visible', () => {
      render(<TagButton tagsVisible={false} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-white');
      expect(button).not.toHaveClass('text-red-500');
      
      const tagIcon = button.querySelector('svg');
      expect(tagIcon).toBeInTheDocument();
      expect(tagIcon).not.toHaveClass('scale-110');
    });

    it('renders correctly when tags are visible', () => {
      render(<TagButton tagsVisible={true} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      expect(button).toBeInTheDocument();
      expect(button).toHaveClass('text-red-500');
      expect(button).not.toHaveClass('text-white');
      
      const tagIcon = button.querySelector('svg');
      expect(tagIcon).toHaveClass('scale-110');
    });
  });

  describe('Functionality', () => {
    it('calls onToggleTags when clicked', () => {
      render(<TagButton tagsVisible={false} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      fireEvent.click(button);
      
      expect(mockOnToggleTags).toHaveBeenCalledTimes(1);
    });

    it('calls onToggleTags multiple times when clicked multiple times', () => {
      render(<TagButton tagsVisible={false} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);
      
      expect(mockOnToggleTags).toHaveBeenCalledTimes(3);
    });
  });

  describe('Styling and Accessibility', () => {
    it('applies correct hover styles', () => {
      render(<TagButton tagsVisible={false} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      expect(button).toHaveClass('hover:scale-110');
      
      const tagIcon = button.querySelector('svg');
      expect(tagIcon).toHaveClass('transition-all', 'duration-300', 'ease-in-out');
    });

    it('has proper aria-label for accessibility', () => {
      render(<TagButton tagsVisible={false} onToggleTags={mockOnToggleTags} />);
      
      const button = screen.getByRole('button', { name: /show tags button/i });
      expect(button).toHaveAttribute('aria-label', 'Show tags button');
    });
  });
});

describe('TagsDisplay', () => {
  const mockTags = [
    {
      x: 0.5,
      y: 0.3,
      label: 'Center Tag'
    },
    {
      x: 0.1,
      y: 0.1,
      label: 'Top Left Tag'
    },
    {
      x: 0.9,
      y: 0.9,
      label: 'Bottom Right Tag'
    },
    {
      x: 0.5,
      y: 0.05,
      label: 'Top Center Tag'
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders nothing when tags is null or undefined', () => {
      const { container } = render(<TagsDisplay tags={null as any} visible={true} />);
      expect(container.firstChild).toBeNull();
      
      const { container: container2 } = render(<TagsDisplay tags={undefined as any} visible={true} />);
      expect(container2.firstChild).toBeNull();
    });

    it('renders tags when visible is true', () => {
      render(<TagsDisplay tags={mockTags} visible={true} />);
      
      // Check that all tags are rendered
      const tagElements = screen.getAllByText(/tag/i);
      expect(tagElements).toHaveLength(4);
      
      // Check specific tag labels
      expect(screen.getByText('Center Tag')).toBeInTheDocument();
      expect(screen.getByText('Top Left Tag')).toBeInTheDocument();
      expect(screen.getByText('Bottom Right Tag')).toBeInTheDocument();
      expect(screen.getByText('Top Center Tag')).toBeInTheDocument();
    });

    it('renders tags with opacity-0 when visible is false', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={false} />);
      
      const tagContainers = container.querySelectorAll('[id^="post tag"]');
      expect(tagContainers).toHaveLength(4);
      
      tagContainers.forEach(tagContainer => {
        expect(tagContainer).toHaveClass('opacity-0');
        expect(tagContainer).not.toHaveClass('opacity-100');
      });
    });

    it('renders tags with opacity-100 when visible is true', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={true} />);
      
      const tagContainers = container.querySelectorAll('[id^="post tag"]');
      expect(tagContainers).toHaveLength(4);
      
      tagContainers.forEach(tagContainer => {
        expect(tagContainer).toHaveClass('opacity-100');
        expect(tagContainer).not.toHaveClass('opacity-0');
      });
    });
  });

  describe('Tag Positioning', () => {
    it('positions tags correctly based on x and y coordinates', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={true} />);
      
      const tagContainers = container.querySelectorAll('[id^="post tag"]');
      
      // Check first tag (center)
      expect(tagContainers[0]).toHaveStyle({
        left: '50%',
        top: '30%'
      });
      
      // Check second tag (top left)
      expect(tagContainers[1]).toHaveStyle({
        left: '10%',
        top: '10%'
      });
      
      // Check third tag (bottom right)
      expect(tagContainers[2]).toHaveStyle({
        left: '90%',
        top: '90%'
      });
    });

    it('sets pointer events correctly based on visibility', () => {
      const { container: visibleContainer } = render(<TagsDisplay tags={mockTags} visible={true} />);
      const { container: hiddenContainer } = render(<TagsDisplay tags={mockTags} visible={false} />);
      
      const visibleTags = visibleContainer.querySelectorAll('[id^="post tag"]');
      const hiddenTags = hiddenContainer.querySelectorAll('[id^="post tag"]');
      
      visibleTags.forEach(tag => {
        expect(tag).toHaveStyle({ pointerEvents: 'auto' });
      });
      
      hiddenTags.forEach(tag => {
        expect(tag).toHaveStyle({ pointerEvents: 'none' });
      });
    });
  });

  describe('Tag Labels', () => {
    it('renders tag labels when present', () => {
      render(<TagsDisplay tags={mockTags} visible={true} />);
      
      mockTags.forEach(tag => {
        expect(screen.getByText(tag.label)).toBeInTheDocument();
      });
    });

    it('does not render label when tag.label is empty or undefined', () => {
      const tagsWithoutLabels = [
        { x: 0.5, y: 0.5, label: '' },
        { x: 0.3, y: 0.3, label: undefined as any },
        { x: 0.7, y: 0.7 } // no label property
      ];
      
      const { container } = render(<TagsDisplay tags={tagsWithoutLabels} visible={true} />);
      
      // Should have tag icons but no label divs
      const tagIcons = container.querySelectorAll('svg');
      expect(tagIcons).toHaveLength(3);
      
      const labelDivs = container.querySelectorAll('.bg-black.text-white');
      expect(labelDivs).toHaveLength(0);
    });
  });

  describe('Error Handling', () => {
    it('handles malformed tag data gracefully', () => {
      const malformedTags = [
        { x: 'invalid', y: 0.5, label: 'Bad X' },
        { x: 0.5, y: null, label: 'Bad Y' },
        null,
        undefined
      ] as any;
      
      expect(() => {
        render(<TagsDisplay tags={malformedTags} visible={true} />);
      }).not.toThrow();
    });

    it('logs error and returns null when tag processing fails', () => {
      // Create tags that will cause an error during processing
      const problematicTags = [
        { x: 0.5, y: 0.5, label: 'Good Tag' }
      ];
      
      // Mock the map function to throw an error
      const originalMap = Array.prototype.map;
      Array.prototype.map = vi.fn().mockImplementation(() => {
        throw new Error('Simulated error');
      });
      
      const { container } = render(<TagsDisplay tags={problematicTags} visible={true} />);
      
      expect(mockConsoleError).toHaveBeenCalledWith('Error parsing tag data:', expect.any(Error));
      expect(container.firstChild).toBeNull();
      
      // Restore original map function
      Array.prototype.map = originalMap;
    });
  });

  describe('Styling', () => {
    it('applies correct CSS classes to tag containers', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={true} />);
      
      const tagContainers = container.querySelectorAll('[id^="post tag"]');
      
      tagContainers.forEach(tagContainer => {
        expect(tagContainer).toHaveClass(
          'absolute',
          'z-20',
          'transform',
          '-translate-x-1/2',
          '-translate-y-1/2',
          'transition-opacity',
          'duration-300',
          'ease-in-out'
        );
      });
    });

    it('applies correct CSS classes to tag icons', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={true} />);
      
      const tagIcons = container.querySelectorAll('svg');
      
      tagIcons.forEach(icon => {
        expect(icon).toHaveClass('h-6', 'w-6', 'text-red-500', 'fill-red-500/50');
      });
    });

    it('applies correct CSS classes to tag labels', () => {
      const { container } = render(<TagsDisplay tags={mockTags} visible={true} />);
      
      const labelDivs = container.querySelectorAll('.bg-black.text-white');
      
      labelDivs.forEach(label => {
        expect(label).toHaveClass(
          'absolute',
          'bg-black',
          'text-white',
          'text-xs',
          'px-2',
          'py-1',
          'rounded-md',
          'whitespace-nowrap',
          'z-30'
        );
      });
    });
  });
});

describe('getLabelPosition', () => {
  describe('Default positioning (center)', () => {
    it('returns default position for center coordinates', () => {
      const position = getLabelPosition(0.5, 0.5);
      
      expect(position).toEqual({
        top: '-top-10',
        left: 'left-1/2',
        transform: '-translate-x-1/2',
        origin: ''
      });
    });
  });

  describe('Top edge positioning', () => {
    it('places label below when pin is near top edge', () => {
      const position = getLabelPosition(0.5, 0.1);
      
      expect(position.top).toBe('top-10');
      expect(position.left).toBe('left-1/2');
      expect(position.transform).toBe('-translate-x-1/2');
    });

    it('uses default top position when pin is not near top edge', () => {
      const position = getLabelPosition(0.5, 0.2);
      
      expect(position.top).toBe('-top-10');
    });
  });

  describe('Left edge positioning', () => {
    it('aligns label to start from pin when near left edge', () => {
      const position = getLabelPosition(0.1, 0.5);
      
      expect(position.left).toBe('left-0');
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-left');
    });

    it('uses default left position when pin is not near left edge', () => {
      const position = getLabelPosition(0.2, 0.5);
      
      expect(position.left).toBe('left-1/2');
      expect(position.transform).toBe('-translate-x-1/2');
      expect(position.origin).toBe('');
    });
  });

  describe('Right edge positioning', () => {
    it('aligns label to end at pin when near right edge', () => {
      const position = getLabelPosition(0.9, 0.5);
      
      expect(position.left).toBe('right-0');
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-right');
    });

    it('uses default left position when pin is not near right edge', () => {
      const position = getLabelPosition(0.8, 0.5);
      
      expect(position.left).toBe('left-1/2');
      expect(position.transform).toBe('-translate-x-1/2');
      expect(position.origin).toBe('');
    });
  });

  describe('Corner positioning', () => {
    it('handles top-left corner correctly', () => {
      const position = getLabelPosition(0.1, 0.1);
      
      expect(position.top).toBe('top-10'); // Below pin
      expect(position.left).toBe('left-0'); // Align to start
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-left');
    });

    it('handles top-right corner correctly', () => {
      const position = getLabelPosition(0.9, 0.1);
      
      expect(position.top).toBe('top-10'); // Below pin
      expect(position.left).toBe('right-0'); // Align to end
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-right');
    });

    it('handles bottom-left corner correctly', () => {
      const position = getLabelPosition(0.1, 0.9);
      
      expect(position.top).toBe('-top-10'); // Above pin
      expect(position.left).toBe('left-0'); // Align to start
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-left');
    });

    it('handles bottom-right corner correctly', () => {
      const position = getLabelPosition(0.9, 0.9);
      
      expect(position.top).toBe('-top-10'); // Above pin
      expect(position.left).toBe('right-0'); // Align to end
      expect(position.transform).toBe('translate-x-0');
      expect(position.origin).toBe('origin-right');
    });
  });

  describe('Edge cases', () => {
    it('handles exact threshold values', () => {
      // Test exact threshold boundaries
      const topThreshold = getLabelPosition(0.5, 0.15);
      const leftThreshold = getLabelPosition(0.15, 0.5);
      const rightThreshold = getLabelPosition(0.85, 0.5);
      
      expect(topThreshold.top).toBe('-top-10'); // Should use default
      expect(leftThreshold.left).toBe('left-1/2'); // Should use default
      expect(rightThreshold.left).toBe('left-1/2'); // Should use default
    });

    it('handles values outside normal range', () => {
      const negativePosition = getLabelPosition(-0.1, -0.1);
      const overflowPosition = getLabelPosition(1.1, 1.1);
      
      // Should still return valid position objects
      expect(negativePosition).toHaveProperty('top');
      expect(negativePosition).toHaveProperty('left');
      expect(overflowPosition).toHaveProperty('top');
      expect(overflowPosition).toHaveProperty('left');
    });
  });
});