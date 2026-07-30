#include <stdint.h>

#define MAX_SEQUENCE_LENGTH 5000
#define NEG_INF (-1000000000)

static uint8_t query_buffer[MAX_SEQUENCE_LENGTH];
static uint8_t subject_buffer[MAX_SEQUENCE_LENGTH];
static int32_t previous_row[MAX_SEQUENCE_LENGTH + 1];
static int32_t current_row[MAX_SEQUENCE_LENGTH + 1];
static int32_t vertical_gap[MAX_SEQUENCE_LENGTH + 1];

static const int8_t blosum62[24][24] = {
    { 4,-1,-2,-2, 0,-1,-1, 0,-2,-1,-1,-1,-1,-2,-1, 1, 0,-3,-2, 0,-2,-1, 0,-4},
    {-1, 5, 0,-2,-3, 1, 0,-2, 0,-3,-2, 2,-1,-3,-2,-1,-1,-3,-2,-3,-1, 0,-1,-4},
    {-2, 0, 6, 1,-3, 0, 0, 0, 1,-3,-3, 0,-2,-3,-2, 1, 0,-4,-2,-3, 3, 0,-1,-4},
    {-2,-2, 1, 6,-3, 0, 2,-1,-1,-3,-4,-1,-3,-3,-1, 0,-1,-4,-3,-3, 4, 1,-1,-4},
    { 0,-3,-3,-3, 9,-3,-4,-3,-3,-1,-1,-3,-1,-2,-3,-1,-1,-2,-2,-1,-3,-3,-2,-4},
    {-1, 1, 0, 0,-3, 5, 2,-2, 0,-3,-2, 1, 0,-3,-1, 0,-1,-2,-1,-2, 0, 3,-1,-4},
    {-1, 0, 0, 2,-4, 2, 5,-2, 0,-3,-3, 1,-2,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1,-4},
    { 0,-2, 0,-1,-3,-2,-2, 6,-2,-4,-4,-2,-3,-3,-2, 0,-2,-2,-3,-3,-1,-2,-1,-4},
    {-2, 0, 1,-1,-3, 0, 0,-2, 8,-3,-3,-1,-2,-1,-2,-1,-2,-2, 2,-3, 0, 0,-1,-4},
    {-1,-3,-3,-3,-1,-3,-3,-4,-3, 4, 2,-3, 1, 0,-3,-2,-1,-3,-1, 3,-3,-3,-1,-4},
    {-1,-2,-3,-4,-1,-2,-3,-4,-3, 2, 4,-2, 2, 0,-3,-2,-1,-2,-1, 1,-4,-3,-1,-4},
    {-1, 2, 0,-1,-3, 1, 1,-2,-1,-3,-2, 5,-1,-3,-1, 0,-1,-3,-2,-2, 0, 1,-1,-4},
    {-1,-1,-2,-3,-1, 0,-2,-3,-2, 1, 2,-1, 5, 0,-2,-1,-1,-1,-1, 1,-3,-1,-1,-4},
    {-2,-3,-3,-3,-2,-3,-3,-3,-1, 0, 0,-3, 0, 6,-4,-2,-2, 1, 3,-1,-3,-3,-1,-4},
    {-1,-2,-2,-1,-3,-1,-1,-2,-2,-3,-3,-1,-2,-4, 7,-1,-1,-4,-3,-2,-2,-1,-2,-4},
    { 1,-1, 1, 0,-1, 0, 0, 0,-1,-2,-2, 0,-1,-2,-1, 4, 1,-3,-2,-2, 0, 0, 0,-4},
    { 0,-1, 0,-1,-1,-1,-1,-2,-2,-1,-1,-1,-1,-2,-1, 1, 5,-2,-2, 0,-1,-1, 0,-4},
    {-3,-3,-4,-4,-2,-2,-3,-2,-2,-3,-2,-3,-1, 1,-4,-3,-2,11, 2,-3,-4,-3,-2,-4},
    {-2,-2,-2,-3,-2,-1,-2,-3, 2,-1,-1,-2,-1, 3,-3,-2,-2, 2, 7,-1,-3,-2,-1,-4},
    { 0,-3,-3,-3,-1,-2,-2,-3,-3, 3, 1,-2, 1,-1,-2,-2, 0,-3,-1, 4,-3,-2,-1,-4},
    {-2,-1, 3, 4,-3, 0, 1,-1, 0,-3,-4, 0,-3,-3,-2, 0,-1,-4,-3,-3, 4, 1,-1,-4},
    {-1, 0, 0, 1,-3, 3, 4,-2, 0,-3,-3, 1,-1,-3,-1, 0,-1,-3,-2,-2, 1, 4,-1,-4},
    { 0,-1,-1,-1,-2,-1,-1,-1,-1,-1,-1,-1,-1,-1,-2, 0, 0,-2,-1,-1,-1,-1,-1,-4},
    {-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4,-4, 1}
};

__attribute__((export_name("get_query_buffer")))
uint32_t get_query_buffer(void) {
    return (uint32_t)(uintptr_t)query_buffer;
}

__attribute__((export_name("get_subject_buffer")))
uint32_t get_subject_buffer(void) {
    return (uint32_t)(uintptr_t)subject_buffer;
}

__attribute__((export_name("score_pair")))
int32_t score_pair(int32_t query_length, int32_t subject_length) {
    if (query_length < 1 || subject_length < 1 ||
        query_length > MAX_SEQUENCE_LENGTH ||
        subject_length > MAX_SEQUENCE_LENGTH) {
        return -1;
    }

    for (int32_t j = 0; j <= subject_length; ++j) {
        previous_row[j] = 0;
        vertical_gap[j] = NEG_INF;
    }

    int32_t best = 0;

    for (int32_t i = 1; i <= query_length; ++i) {
        current_row[0] = 0;
        int32_t horizontal_gap = NEG_INF;

        for (int32_t j = 1; j <= subject_length; ++j) {
            int32_t open_vertical = previous_row[j] - 11;
            int32_t extend_vertical = vertical_gap[j] - 1;
            vertical_gap[j] =
                open_vertical > extend_vertical ? open_vertical : extend_vertical;

            int32_t open_horizontal = current_row[j - 1] - 11;
            int32_t extend_horizontal = horizontal_gap - 1;
            horizontal_gap =
                open_horizontal > extend_horizontal ? open_horizontal : extend_horizontal;

            uint8_t q = query_buffer[i - 1];
            uint8_t s = subject_buffer[j - 1];
            if (q > 23) q = 22;
            if (s > 23) s = 22;

            int32_t score = previous_row[j - 1] + blosum62[q][s];
            if (vertical_gap[j] > score) score = vertical_gap[j];
            if (horizontal_gap > score) score = horizontal_gap;
            if (score < 0) score = 0;

            current_row[j] = score;
            if (score > best) best = score;
        }

        for (int32_t j = 0; j <= subject_length; ++j) {
            previous_row[j] = current_row[j];
        }
    }

    return best;
}
