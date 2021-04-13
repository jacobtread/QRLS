drop table if exists attendance_record;

create table attendance_record
(
    attendance_id int auto_increment,
    full_name     text    not null,
    registered    tinyint not null,
    arrival_date  date    not null,
    arrival_time  time    not null,
    constraint attendance_record_attendance_id_uindex
        unique (attendance_id)
);

alter table attendance_record
    add primary key (attendance_id);