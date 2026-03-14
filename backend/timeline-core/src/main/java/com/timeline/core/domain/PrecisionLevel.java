package com.timeline.core.domain;

public enum PrecisionLevel {
    BILLION_YEARS(0, "10억년"),
    HUNDRED_MILLION_YEARS(1, "1억년"),
    TEN_MILLION_YEARS(2, "1000만년"),
    MILLION_YEARS(3, "백만년"),
    HUNDRED_THOUSAND_YEARS(4, "10만년"),
    TEN_THOUSAND_YEARS(5, "1만년"),
    MILLENNIUM(6, "천년"),
    CENTURY(7, "세기"),
    DECADE(8, "10년"),
    YEAR(9, "연도"),
    MONTH(10, "월"),
    DAY(11, "일"),
    HOUR(12, "시"),
    MINUTE(13, "분"),
    SECOND(14, "초");

    private final int code;
    private final String description;

    PrecisionLevel(int code, String description) {
        this.code = code;
        this.description = description;
    }

    public int getCode() {
        return code;
    }

    public String getDescription() {
        return description;
    }

    public static PrecisionLevel fromCode(int code) {
        for (PrecisionLevel level : values()) {
            if (level.code == code) {
                return level;
            }
        }
        throw new IllegalArgumentException("Unknown precision code: " + code);
    }

    public boolean requiresDateTime() {
        return this.code >= DAY.code;
    }
}
