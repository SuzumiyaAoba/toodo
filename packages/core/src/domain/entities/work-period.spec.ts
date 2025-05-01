import { describe, expect, test } from "bun:test";
import { WorkPeriod } from "./work-period";

describe("WorkPeriod", () => {
  const workPeriodId = "test-id";
  const name = "Test Work Period";
  const now = new Date();
  const startTime = new Date(now.getTime() - 3600000); // 1 hour ago
  const endTime = new Date(now.getTime());
  const date = new Date(now.setHours(0, 0, 0, 0)); // Today at midnight

  test("should create a new WorkPeriod instance", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);

    expect(workPeriod.id).toBe(workPeriodId);
    expect(workPeriod.name).toBe(name);
    expect(workPeriod.startTime).toBe(startTime);
    expect(workPeriod.endTime).toBe(endTime);
    expect(workPeriod.date).toBe(date);
  });

  test("should throw an error if start time is after end time", () => {
    expect(() => {
      new WorkPeriod(workPeriodId, name, endTime, startTime, date);
    }).toThrow("Start time must be before end time");
  });

  test("should update name", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const newName = "Updated Work Period";
    const updatedWorkPeriod = workPeriod.updateName(newName);

    expect(updatedWorkPeriod.id).toBe(workPeriodId);
    expect(updatedWorkPeriod.name).toBe(newName);
    expect(updatedWorkPeriod.startTime).toBe(startTime);
    expect(updatedWorkPeriod.endTime).toBe(endTime);
    expect(updatedWorkPeriod.date).toBe(date);
    expect(updatedWorkPeriod.updatedAt).not.toBe(workPeriod.updatedAt);
  });

  test("should not update name if it's the same", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const updatedWorkPeriod = workPeriod.updateName(name);

    expect(updatedWorkPeriod).toBe(workPeriod); // Should return the same instance
  });

  test("should update period", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const newStartTime = new Date(startTime.getTime() - 1800000); // 30 minutes earlier
    const newEndTime = new Date(endTime.getTime() + 1800000); // 30 minutes later
    const updatedWorkPeriod = workPeriod.updatePeriod(newStartTime, newEndTime);

    expect(updatedWorkPeriod.id).toBe(workPeriodId);
    expect(updatedWorkPeriod.name).toBe(name);
    expect(updatedWorkPeriod.startTime).toBe(newStartTime);
    expect(updatedWorkPeriod.endTime).toBe(newEndTime);
    expect(updatedWorkPeriod.date).toBe(date);
    expect(updatedWorkPeriod.updatedAt).not.toBe(workPeriod.updatedAt);
  });

  test("should throw an error when updating period with invalid times", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);

    expect(() => {
      workPeriod.updatePeriod(endTime, startTime);
    }).toThrow("Start time must be before end time");
  });

  test("should not update period if times are the same", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const updatedWorkPeriod = workPeriod.updatePeriod(startTime, endTime);

    expect(updatedWorkPeriod).toBe(workPeriod); // Should return the same instance
  });

  test("should update date", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const newDate = new Date(date.getTime() + 86400000); // Tomorrow
    const updatedWorkPeriod = workPeriod.updateDate(newDate);

    expect(updatedWorkPeriod.id).toBe(workPeriodId);
    expect(updatedWorkPeriod.name).toBe(name);
    expect(updatedWorkPeriod.startTime).toBe(startTime);
    expect(updatedWorkPeriod.endTime).toBe(endTime);
    expect(updatedWorkPeriod.date).toBe(newDate);
    expect(updatedWorkPeriod.updatedAt).not.toBe(workPeriod.updatedAt);
  });

  test("should not update date if it's the same", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const updatedWorkPeriod = workPeriod.updateDate(date);

    expect(updatedWorkPeriod).toBe(workPeriod); // Should return the same instance
  });

  test("should calculate duration in milliseconds", () => {
    const workPeriod = new WorkPeriod(workPeriodId, name, startTime, endTime, date);
    const expectedDuration = endTime.getTime() - startTime.getTime();

    expect(workPeriod.getDurationMs()).toBe(expectedDuration);
  });

  test("should detect overlapping periods - case 1: this starts before other", () => {
    const workPeriod1 = new WorkPeriod(
      "wp1",
      "Period 1",
      new Date("2023-01-01T10:00:00Z"),
      new Date("2023-01-01T12:00:00Z"),
      new Date("2023-01-01"),
    );

    const workPeriod2 = new WorkPeriod(
      "wp2",
      "Period 2",
      new Date("2023-01-01T11:00:00Z"),
      new Date("2023-01-01T13:00:00Z"),
      new Date("2023-01-01"),
    );

    expect(workPeriod1.overlaps(workPeriod2)).toBe(true);
    expect(workPeriod2.overlaps(workPeriod1)).toBe(true);
  });

  test("should detect overlapping periods - case 2: this is contained within other", () => {
    const workPeriod1 = new WorkPeriod(
      "wp1",
      "Period 1",
      new Date("2023-01-01T10:00:00Z"),
      new Date("2023-01-01T14:00:00Z"),
      new Date("2023-01-01"),
    );

    const workPeriod2 = new WorkPeriod(
      "wp2",
      "Period 2",
      new Date("2023-01-01T11:00:00Z"),
      new Date("2023-01-01T13:00:00Z"),
      new Date("2023-01-01"),
    );

    expect(workPeriod1.overlaps(workPeriod2)).toBe(true);
    expect(workPeriod2.overlaps(workPeriod1)).toBe(true);
  });

  test("should detect non-overlapping periods", () => {
    const workPeriod1 = new WorkPeriod(
      "wp1",
      "Period 1",
      new Date("2023-01-01T10:00:00Z"),
      new Date("2023-01-01T12:00:00Z"),
      new Date("2023-01-01"),
    );

    const workPeriod2 = new WorkPeriod(
      "wp2",
      "Period 2",
      new Date("2023-01-01T12:00:00Z"), // Starts exactly when period1 ends
      new Date("2023-01-01T14:00:00Z"),
      new Date("2023-01-01"),
    );

    expect(workPeriod1.overlaps(workPeriod2)).toBe(false);
    expect(workPeriod2.overlaps(workPeriod1)).toBe(false);
  });

  test("should detect same date", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-01-01T23:59:59Z"); // Same day, different time

    const workPeriod1 = new WorkPeriod("wp1", "Period 1", startTime, endTime, date1);

    const workPeriod2 = new WorkPeriod("wp2", "Period 2", startTime, endTime, date2);

    expect(workPeriod1.isSameDate(workPeriod2)).toBe(true);
  });

  test("should detect different dates", () => {
    const date1 = new Date("2023-01-01");
    const date2 = new Date("2023-01-02"); // Next day

    const workPeriod1 = new WorkPeriod("wp1", "Period 1", startTime, endTime, date1);

    const workPeriod2 = new WorkPeriod("wp2", "Period 2", startTime, endTime, date2);

    expect(workPeriod1.isSameDate(workPeriod2)).toBe(false);
  });

  test("should create a new WorkPeriod using static factory method", () => {
    const workPeriod = WorkPeriod.createNew({
      id: workPeriodId,
      name,
      startTime,
      endTime,
      date,
    });

    expect(workPeriod.id).toBe(workPeriodId);
    expect(workPeriod.name).toBe(name);
    expect(workPeriod.startTime).toBe(startTime);
    expect(workPeriod.endTime).toBe(endTime);
    expect(workPeriod.date).toBe(date);
  });

  test("should create a new WorkPeriod with default date using static factory method", () => {
    const workPeriod = WorkPeriod.createNew({
      id: workPeriodId,
      name,
      startTime,
      endTime,
    });

    expect(workPeriod.id).toBe(workPeriodId);
    expect(workPeriod.name).toBe(name);
    expect(workPeriod.startTime).toBe(startTime);
    expect(workPeriod.endTime).toBe(endTime);
    expect(workPeriod.date).toBeInstanceOf(Date);
  });
});
